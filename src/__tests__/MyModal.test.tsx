import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import MyModal from "components/MyModal";
import useAIJob from "hooks/useAIJob";

describe("MyModal layout", () => {
  test("the footer is rendered outside the scrolling body, so it stays pinned", () => {
    render(
      <MyModal title="Tiêu đề" onClose={() => {}} footer={<button>Lưu</button>}>
        <p>Nội dung dài</p>
      </MyModal>
    );
    const body = screen.getByText("Nội dung dài").parentElement!;
    const footer = screen.getByText("Lưu").closest("footer")!;
    const header = screen.getByText("Tiêu đề").closest("header")!;
    expect(body.contains(footer)).toBe(false);
    expect(body.contains(header)).toBe(false);
    expect(footer).toBeInTheDocument();
  });
});

describe("MyModal close guard", () => {
  test("closes straight away when nothing is running", () => {
    const onClose = jest.fn();
    render(<MyModal title="A" onClose={onClose}>x</MyModal>);
    fireEvent.click(screen.getByTitle("Đóng (Esc)"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("asks first while guarded; staying keeps the modal, confirming closes it", () => {
    const onClose = jest.fn();
    render(
      <MyModal title="A" onClose={onClose} guard={{ when: true, message: "AI đang chạy", confirmLabel: "Hủy và đóng", stayLabel: "Tiếp tục chờ" }}>
        x
      </MyModal>
    );
    fireEvent.click(screen.getByTitle("Đóng (Esc)"));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText("AI đang chạy")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Tiếp tục chờ"));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByText("AI đang chạy")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTitle("Đóng (Esc)"));
    fireEvent.click(screen.getByText("Hủy và đóng"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("Escape reaches only the top-most modal", () => {
    const outer = jest.fn();
    const inner = jest.fn();
    render(
      <>
        <MyModal title="Outer" onClose={outer}>a</MyModal>
        <MyModal title="Inner" onClose={inner}>b</MyModal>
      </>
    );
    fireEvent.keyDown(window, { key: "Escape" });
    expect(inner).toHaveBeenCalledTimes(1);
    expect(outer).not.toHaveBeenCalled();
  });

  test("an AI request started inside the modal makes closing it ask first (and tells you tokens may be billed)", async () => {
    const onClose = jest.fn();
    let finish: (v: string) => void = () => {};
    function Child() {
      const job = useAIJob();
      return <button onClick={() => job.run(() => new Promise<string>((r) => (finish = r)))}>Chạy AI</button>;
    }
    render(
      <MyModal title="A" onClose={onClose}>
        <Child />
      </MyModal>
    );
    // idle: closing is immediate
    await act(async () => {
      fireEvent.click(screen.getByText("Chạy AI"));
    });
    fireEvent.click(screen.getByTitle("Đóng (Esc)"));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText(/phí token/)).toBeInTheDocument();

    // once the request is done, the warning no longer applies
    fireEvent.click(screen.getByText("Tiếp tục chờ"));
    await act(async () => {
      finish("ok");
    });
    fireEvent.click(screen.getByTitle("Đóng (Esc)"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
