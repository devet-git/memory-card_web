import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut
} from "firebase/auth";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Google Drive scope for file management created by this app
provider.addScope("https://www.googleapis.com/auth/drive.file");
provider.setCustomParameters({
  prompt: "consent"
});

let isSigningIn = false;
// The OAuth access token lives ~1h; keep it across reloads so auto-sync keeps working.
const TOKEN_STORAGE_KEY = "memcard_gdrive_token";
const TOKEN_TTL_MS = 55 * 60 * 1000;

function loadStoredToken(): string | null {
  try {
    const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!raw) return null;
    const { token, expiresAt } = JSON.parse(raw);
    if (token && Date.now() < expiresAt) return token;
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (e) {}
  return null;
}

function storeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({ token, expiresAt: Date.now() + TOKEN_TTL_MS }));
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (e) {}
}

let cachedAccessToken: string | null = loadStoredToken();
let currentUser: User | null = null;

// Track auth state
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    currentUser = user;
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      storeToken(null);
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Không lấy được Access Token từ Google");
    }

    cachedAccessToken = credential.accessToken;
    storeToken(cachedAccessToken);
    currentUser = result.user;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Lỗi đăng nhập Google:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken && !loadStoredToken()) cachedAccessToken = null; // expired
  return cachedAccessToken;
};

export const getCurrentUser = (): User | null => {
  return currentUser || auth.currentUser;
};

export const logoutGoogle = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
  storeToken(null);
  currentUser = null;
};

const BACKUP_FILE_NAME = "memcard_backup.json";

// Find existing backup file on Google Drive
async function findBackupFile(accessToken: string): Promise<{ id: string; modifiedTime: string } | null> {
  const q = encodeURIComponent(`name = '${BACKUP_FILE_NAME}' and trashed = false`);
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,modifiedTime)`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || "Không thể truy vấn Google Drive");
  }

  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return { id: data.files[0].id, modifiedTime: data.files[0].modifiedTime };
  }
  return null;
}

/** Modified time of the backup on Drive (null if none / not signed in). */
export async function getDriveBackupModifiedTime(): Promise<string | null> {
  const accessToken = await getAccessToken();
  if (!accessToken) return null;
  const file = await findBackupFile(accessToken);
  return file ? file.modifiedTime : null;
}

// Upload/Sync data to Google Drive
export async function syncToGoogleDrive(
  dataJson: string
): Promise<{ success: boolean; fileId?: string; modifiedTime?: string; error?: string }> {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return { success: false, error: "Chưa đăng nhập Google hoặc phiên làm việc đã hết hạn" };
    }

    const existingFile = await findBackupFile(accessToken);

    if (existingFile) {
      // Update existing file content
      const updateRes = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: dataJson
        }
      );

      if (!updateRes.ok) {
        throw new Error("Không thể cập nhật tệp tin trên Google Drive");
      }

      const updatedData = await updateRes.json();
      return {
        success: true,
        fileId: updatedData.id,
        modifiedTime: new Date().toISOString()
      };
    } else {
      // Create new file with multipart upload
      const metadata = {
        name: BACKUP_FILE_NAME,
        mimeType: "application/json",
        description: "MemCard Flashcard Database Auto-Sync"
      };

      const boundary = "-------314159265358979323846";
      const delimiter = "\r\n--" + boundary + "\r\n";
      const closeDelim = "\r\n--" + boundary + "--";

      const multipartRequestBody =
        delimiter +
        "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
        JSON.stringify(metadata) +
        delimiter +
        "Content-Type: application/json\r\n\r\n" +
        dataJson +
        closeDelim;

      const createRes = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": `multipart/related; boundary=${boundary}`
          },
          body: multipartRequestBody
        }
      );

      if (!createRes.ok) {
        throw new Error("Không thể tạo tệp mới trên Google Drive");
      }

      const newFileData = await createRes.json();
      return {
        success: true,
        fileId: newFileData.id,
        modifiedTime: new Date().toISOString()
      };
    }
  } catch (err: any) {
    return { success: false, error: err.message || "Lỗi đồng bộ Google Drive" };
  }
}

// Download/Restore data from Google Drive
export async function restoreFromGoogleDrive(): Promise<{
  success: boolean;
  data?: any;
  modifiedTime?: string;
  error?: string;
}> {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return { success: false, error: "Chưa đăng nhập Google hoặc phiên làm việc đã hết hạn" };
    }

    const existingFile = await findBackupFile(accessToken);
    if (!existingFile) {
      return { success: false, error: "Không tìm thấy tệp sao lưu memcard_backup.json nào trên Google Drive của bạn" };
    }

    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${existingFile.id}?alt=media`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!res.ok) {
      throw new Error("Không thể tải tệp tin từ Google Drive");
    }

    const data = await res.json();
    return {
      success: true,
      data,
      modifiedTime: existingFile.modifiedTime
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Lỗi khôi phục từ Google Drive" };
  }
}
