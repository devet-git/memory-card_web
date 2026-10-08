import React, { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import SearchSelect, { SelectOption } from "components/SearchSelect";

const OPTIONS: SelectOption[] = [
  { value: "hoc", label: "Học từ vựng", description: "12 thẻ" },
  { value: "giao-tiep", label: "Giao tiếp hằng ngày" },
  { value: "it", label: "Lập trình" }
];

function Single({ onChange = () => {}, creatable = false }: { onChange?: (v: string) => void; creatable?: boolean }) {
  const [value, setValue] = useState("");
  return (
    <SearchSelect
      value={value}
      creatable={creatable}
      onChange={(v) => {
        setValue(v);
        onChange(v);
      }}
      options={OPTIONS}
      placeholder="Chọn bộ"
      ariaLabel="Bộ thẻ"
    />
  );
}

function Multi({ initial = [] as string[] }) {
  const [values, setValues] = useState<string[]>(initial);
  return <SearchSelect multiple value={values} onChange={setValues} options={OPTIONS} placeholder="Chọn nhiều" ariaLabel="Nhiều bộ" />;
}

const open = (name: string) => fireEvent.click(screen.getByRole("button", { name }));
const search = (text: string) => fireEvent.change(screen.getByLabelText("Tìm kiếm trong danh sách"), { target: { value: text } });

describe("SearchSelect (single)", () => {
  test("has a search box that filters options, ignoring case and accents", () => {
    render(<Single />);
    open("Bộ thẻ");
    expect(screen.getAllByRole("option")).toHaveLength(3);
    search("HOC");
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Học từ vựng");
  });

  test("also searches the description", () => {
    render(<Single />);
    open("Bộ thẻ");
    search("12 thẻ");
    expect(screen.getAllByRole("option")).toHaveLength(1);
  });

  test("picking an option sets the value and closes the list", () => {
    const onChange = jest.fn();
    render(<Single onChange={onChange} />);
    open("Bộ thẻ");
    fireEvent.click(screen.getByRole("option", { name: /Lập trình/ }));
    expect(onChange).toHaveBeenCalledWith("it");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bộ thẻ" })).toHaveTextContent("Lập trình");
  });

  test("shows an empty message when nothing matches", () => {
    render(<Single />);
    open("Bộ thẻ");
    search("zzz");
    expect(screen.getByText("Không có kết quả")).toBeInTheDocument();
  });

  test("keyboard: arrows move, Enter picks, and Enter never submits the surrounding form", () => {
    const onSubmit = jest.fn((e) => e.preventDefault());
    const onChange = jest.fn();
    render(
      <form onSubmit={onSubmit}>
        <Single onChange={onChange} />
      </form>
    );
    open("Bộ thẻ");
    const input = screen.getByLabelText("Tìm kiếm trong danh sách");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("giao-tiep");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("creatable offers to create what was typed, but not when it already exists", () => {
    const onChange = jest.fn();
    render(<Single creatable onChange={onChange} />);
    open("Bộ thẻ");
    search("Y học");
    fireEvent.click(screen.getByRole("option", { name: /Tạo "Y học"/ }));
    expect(onChange).toHaveBeenCalledWith("Y học");

    open("Bộ thẻ");
    search("lap trinh");
    expect(screen.queryByText(/Tạo "/)).not.toBeInTheDocument();
  });
});

describe("SearchSelect (multiple)", () => {
  test("toggles several options and shows them as chips that can be removed", () => {
    render(<Multi />);
    open("Nhiều bộ");
    fireEvent.click(screen.getByRole("option", { name: /Học từ vựng/ }));
    fireEvent.click(screen.getByRole("option", { name: /Lập trình/ }));
    expect(screen.getByRole("listbox")).toBeInTheDocument(); // stays open for more picks
    fireEvent.click(screen.getByRole("button", { name: "Nhiều bộ" }));
    expect(screen.getByRole("button", { name: "Bỏ Học từ vựng" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Bỏ Học từ vựng" }));
    expect(screen.queryByRole("button", { name: "Bỏ Học từ vựng" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bỏ Lập trình" })).toBeInTheDocument();
  });

  test('"Chọn tất cả" selects only what the search currently shows', () => {
    render(<Multi />);
    open("Nhiều bộ");
    search("giao");
    fireEvent.click(screen.getByText("Chọn tất cả"));
    fireEvent.click(screen.getByRole("button", { name: "Nhiều bộ" }));
    expect(screen.getByRole("button", { name: "Bỏ Giao tiếp hằng ngày" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Bỏ Lập trình" })).not.toBeInTheDocument();
  });

  test('"Bỏ chọn" clears everything', () => {
    render(<Multi initial={["hoc", "it"]} />);
    open("Nhiều bộ");
    fireEvent.click(screen.getByText("Bỏ chọn"));
    expect(screen.getByRole("button", { name: "Nhiều bộ" })).toHaveTextContent("Chọn nhiều");
  });
});
