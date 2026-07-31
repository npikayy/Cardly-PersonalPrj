import {
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  Check,
  ChevronRight,
  CloudUpload,
  ContactRound,
  FileText,
  Languages,
  Link,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Plus,
  QrCode,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  UserPlus,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

const ACCESS_TOKEN_KEY = "cardly.accessToken.v2";
const REFRESH_TOKEN_KEY = "cardly.refreshToken.v2";
const LANGUAGE_KEY = "cardly.language";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
const LEGACY_TOKEN_KEYS = ["cardly.accessToken", "cardly.refreshToken"];

const views = [
  { key: "contacts", labelKey: "navContacts", icon: ContactRound },
  { key: "manual", labelKey: "navManual", icon: UserPlus },
  { key: "ocr", labelKey: "navOcr", icon: FileText },
  { key: "digital", labelKey: "navDigital", icon: QrCode },
];

const I18N = {
  vi: {
    navContacts: "Danh bạ",
    navManual: "Thêm liên hệ",
    navOcr: "OCR",
    navDigital: "Thẻ số",
    login: "Đăng nhập",
    register: "Đăng ký",
    otp: "OTP",
    logout: "Đăng xuất",
    refresh: "Làm mới",
    verified: "Đã xác thực",
    session: "Phiên làm việc",
    contactsMetric: "Liên hệ",
    scansMetric: "Bản scan",
    contactsTitle: "Danh bạ đã lưu",
    contactsDesc: "Các liên hệ đã xác nhận từ OCR hoặc được thêm thủ công.",
    addManual: "Thêm thủ công",
    scanNewCard: "Scan danh thiếp",
    search: "Tìm kiếm",
    searchContactsPlaceholder: "Tên, công ty, email, số điện thoại",
    contactsCount: "{count} liên hệ",
    emptyContactsTitle: "Chưa có liên hệ nào",
    emptyContactsDesc: "Sau khi scan và xác nhận danh thiếp, liên hệ sẽ xuất hiện tại đây.",
    manualTitle: "Thêm liên hệ thủ công",
    manualDesc: "Tạo nhanh một liên hệ khi bạn chưa có ảnh danh thiếp.",
    backContacts: "Về danh bạ",
    switchOcr: "Chuyển sang OCR",
    manualSourceTitle: "Nguồn dữ liệu",
    manualSourceDesc: "Liên hệ thủ công dùng chung danh bạ với liên hệ từ OCR.",
    noImageTitle: "Liên hệ này chưa có ảnh danh thiếp",
    noImageDesc: "Liên hệ thêm thủ công hoặc bản scan cũ có thể không còn ảnh gốc.",
    detailMissingTitle: "Không tìm thấy liên hệ",
    detailMissingDesc: "Liên hệ này có thể đã bị xoá hoặc danh bạ vừa được làm mới.",
    back: "Quay lại",
    deleteContact: "Xoá liên hệ",
    contactInfo: "Thông tin liên hệ",
    contactInfoDesc: "Chi tiết được lưu từ OCR hoặc nhập thủ công.",
    meetingContext: "Ngữ cảnh gặp gỡ",
    meetingContextDesc: "Nguồn, sự kiện và ghi chú gắn với liên hệ.",
    insight: "Gợi ý & ghi chú",
    insightDesc: "Tóm tắt, QR và dữ liệu enrichment.",
    summary: "Tóm tắt",
    noSummary: "Chưa có ghi chú hoặc tóm tắt.",
    highlights: "Điểm nổi bật",
    businessCardImages: "Ảnh danh thiếp",
    businessCardImagesDesc: "Ảnh gốc đã lưu trên Cloudinary trước khi OCR.",
    imagesCount: "{count} ảnh",
    frontSide: "Mặt trước",
    imageIndex: "Ảnh {count}",
    createContact: "Tạo liên hệ",
    uploadFront: "Ảnh mặt trước",
    uploadBack: "Ảnh mặt sau",
    chooseImage: "Chọn ảnh",
    uploadOcr: "Upload OCR",
    scanQueue: "Hàng đợi scan",
    scanQueueDesc: "{count} bản ghi đang hiển thị.",
    clearQueue: "Xoá hàng đợi",
    findScan: "Tìm scan",
    scanPlaceholder: "Processing ID, file, trạng thái",
    emptyScansTitle: "Chưa có bản scan",
    emptyScansDesc: "Upload ảnh để tạo bản ghi OCR.",
    preview: "Xem trước",
    noSelectedScan: "Chưa chọn bản scan",
    previewEmpty: "Chọn một bản scan để xem ảnh.",
    ocrResult: "Kết quả OCR",
    ocrResultDesc: "Chạy OCR, kiểm tra dữ liệu, rồi lưu vào danh bạ.",
    runOcr: "Chạy OCR",
    saveContact: "Lưu vào danh bạ",
    deleteScan: "Xoá scan",
    digitalTitle: "Thẻ liên hệ số",
    digitalDesc: "Hồ sơ công khai để chia sẻ bằng link hoặc QR.",
    saveDigital: "Lưu thẻ số",
    publicPreview: "Xem trước công khai",
    noPublicUrl: "Chưa tạo public URL",
    viewContacts: "Quản lý danh bạ",
    viewManual: "Thêm liên hệ",
    viewDetail: "Chi tiết liên hệ",
    viewOcr: "OCR Workspace",
    viewDigital: "Thẻ liên hệ số",
    eyebrowContacts: "Danh bạ",
    eyebrowManual: "Nhập thủ công",
    eyebrowDetail: "Danh bạ",
    eyebrowOcr: "Scan & review",
    eyebrowDigital: "Public profile",
    name: "Tên",
    fullName: "Họ tên",
    title: "Chức danh",
    company: "Công ty",
    position: "Chức vụ",
    phone: "Số điện thoại",
    address: "Địa chỉ",
    event: "Sự kiện",
    location: "Địa điểm",
    source: "Nguồn",
    notes: "Ghi chú",
    confirmedAt: "Xác nhận lúc",
    emptyName: "Chưa có tên",
    personalContact: "Liên hệ cá nhân",
    noCompany: "Chưa có công ty",
    uploadDesc: "Hỗ trợ ảnh mặt trước và mặt sau.",
    reviewEmptyTitle: "Chưa có dữ liệu OCR",
    reviewEmptyDesc: "Chọn một bản scan trong hàng đợi rồi chạy OCR để xem dữ liệu trích xuất.",
    saveEdits: "Lưu chỉnh sửa",
    yourName: "Tên của bạn",
    titleCompany: "Chức danh · Công ty",
    shortBioPlaceholder: "Bio ngắn sẽ hiển thị ở đây.",
    password: "Mật khẩu",
    createAccount: "Tạo tài khoản",
    otpEmail: "Email nhận OTP",
    otpCode: "Mã OTP",
    verifyAccount: "Xác thực tài khoản",
    resendOtp: "Gửi lại OTP",
    loginSuccess: "Đăng nhập thành công.",
    otpSent: "Đã gửi OTP xác thực.",
    accountVerified: "Tài khoản đã được xác thực.",
    otpResent: "Đã gửi lại OTP.",
    logoutSuccess: "Đã đăng xuất.",
    manualCreated: "Đã tạo liên hệ thủ công.",
    frontImageRequired: "Vui lòng chọn ảnh mặt trước trước khi upload.",
    ocrDone: "OCR hoàn tất, dữ liệu review đã sẵn sàng.",
    reviewSaved: "Đã lưu chỉnh sửa review.",
    contactSaved: "Đã lưu vào danh bạ.",
    scanDeleted: "Đã xoá bản scan.",
    queueCleared: "Đã xoá {count} bản scan trong hàng đợi.",
    contactDeleted: "Đã xoá liên hệ.",
    digitalSaved: "Đã lưu thẻ số.",
    uploadDone: "Đã upload {id}.",
    digitalProfileSection: "Thông tin hiển thị",
    digitalContactSection: "Kênh liên hệ",
    digitalHighlightSection: "Điểm nổi bật trên thẻ",
  },
  en: {
    navContacts: "Contacts",
    navManual: "Add contact",
    navOcr: "OCR",
    navDigital: "Digital card",
    login: "Log in",
    register: "Register",
    otp: "OTP",
    logout: "Log out",
    refresh: "Refresh",
    verified: "Verified",
    session: "Session",
    contactsMetric: "Contacts",
    scansMetric: "Scans",
    contactsTitle: "Saved contacts",
    contactsDesc: "Contacts confirmed from OCR or added manually.",
    addManual: "Add manually",
    scanNewCard: "Scan card",
    search: "Search",
    searchContactsPlaceholder: "Name, company, email, phone",
    contactsCount: "{count} contacts",
    emptyContactsTitle: "No contacts yet",
    emptyContactsDesc: "After you scan and confirm a business card, the contact will appear here.",
    manualTitle: "Add contact manually",
    manualDesc: "Create a contact quickly when you do not have a business-card image.",
    backContacts: "Back to contacts",
    switchOcr: "Go to OCR",
    manualSourceTitle: "Data source",
    manualSourceDesc: "Manual contacts live in the same address book as OCR contacts.",
    noImageTitle: "This contact has no business-card image",
    noImageDesc: "Manual contacts or older scans may not have an original image attached.",
    detailMissingTitle: "Contact not found",
    detailMissingDesc: "This contact may have been deleted or the address book was refreshed.",
    back: "Back",
    deleteContact: "Delete contact",
    contactInfo: "Contact information",
    contactInfoDesc: "Details saved from OCR or entered manually.",
    meetingContext: "Meeting context",
    meetingContextDesc: "Source, event and notes attached to this contact.",
    insight: "Insights & notes",
    insightDesc: "Summary, QR codes and enrichment data.",
    summary: "Summary",
    noSummary: "No notes or summary yet.",
    highlights: "Highlights",
    businessCardImages: "Business-card images",
    businessCardImagesDesc: "Original Cloudinary images saved before OCR.",
    imagesCount: "{count} images",
    frontSide: "Front side",
    imageIndex: "Image {count}",
    createContact: "Create contact",
    uploadFront: "Front image",
    uploadBack: "Back image",
    chooseImage: "Choose image",
    uploadOcr: "Upload OCR",
    scanQueue: "Scan queue",
    scanQueueDesc: "{count} records shown.",
    clearQueue: "Clear queue",
    findScan: "Find scan",
    scanPlaceholder: "Processing ID, file, status",
    emptyScansTitle: "No scans yet",
    emptyScansDesc: "Upload an image to create an OCR record.",
    preview: "Preview",
    noSelectedScan: "No scan selected",
    previewEmpty: "Select a scan to preview the image.",
    ocrResult: "OCR result",
    ocrResultDesc: "Run OCR, review the data, then save it to contacts.",
    runOcr: "Run OCR",
    saveContact: "Save contact",
    deleteScan: "Delete scan",
    digitalTitle: "Digital contact card",
    digitalDesc: "A public profile for sharing with a link or QR code.",
    saveDigital: "Save digital card",
    publicPreview: "Public preview",
    noPublicUrl: "No public URL yet",
    viewContacts: "Contact management",
    viewManual: "Add contact",
    viewDetail: "Contact details",
    viewOcr: "OCR Workspace",
    viewDigital: "Digital contact card",
    eyebrowContacts: "Contacts",
    eyebrowManual: "Manual entry",
    eyebrowDetail: "Contacts",
    eyebrowOcr: "Scan & review",
    eyebrowDigital: "Public profile",
    name: "Name",
    fullName: "Full name",
    title: "Title",
    company: "Company",
    position: "Position",
    phone: "Phone",
    address: "Address",
    event: "Event",
    location: "Location",
    source: "Source",
    notes: "Notes",
    confirmedAt: "Confirmed at",
    emptyName: "Unnamed contact",
    personalContact: "Personal contact",
    noCompany: "No company yet",
    uploadDesc: "Supports front and back images.",
    reviewEmptyTitle: "No OCR data loaded",
    reviewEmptyDesc: "Select a scan from the queue, then run OCR to see extracted fields.",
    saveEdits: "Save edits",
    yourName: "Your name",
    titleCompany: "Title · Company",
    shortBioPlaceholder: "A short bio will appear here.",
    password: "Password",
    createAccount: "Create account",
    otpEmail: "OTP email",
    otpCode: "OTP code",
    verifyAccount: "Verify account",
    resendOtp: "Resend OTP",
    loginSuccess: "Logged in successfully.",
    otpSent: "Verification OTP sent.",
    accountVerified: "Account verified.",
    otpResent: "OTP resent.",
    logoutSuccess: "Logged out.",
    manualCreated: "Manual contact created.",
    frontImageRequired: "Please choose the front image before uploading.",
    ocrDone: "OCR complete. Review data is ready.",
    reviewSaved: "Review edits saved.",
    contactSaved: "Saved to contacts.",
    scanDeleted: "Scan deleted.",
    queueCleared: "Cleared {count} scans from the queue.",
    contactDeleted: "Contact deleted.",
    digitalSaved: "Digital card saved.",
    uploadDone: "Uploaded {id}.",
    digitalProfileSection: "Display profile",
    digitalContactSection: "Contact channels",
    digitalHighlightSection: "Card highlights",
  },
};

const REVIEW_FIELDS = [
  "name",
  "company",
  "position",
  "email",
  "phones",
  "website",
  "address",
  "social_profiles",
  "professional_brief",
  "keywords",
  "highlights",
  "qr_codes",
];

const CONTEXT_FIELDS = ["event_name", "location", "source", "tags", "notes"];

function App() {
  const [currentPath, setCurrentPath] = useState(() => normalizePath(window.location.pathname));
  const publicSlug = currentPath.match(/^\/card\/([^/]+)/)?.[1] || "";
  const isLoginPath = currentPath === "/login";
  const [accessToken, setAccessToken] = useState(localStorage.getItem(ACCESS_TOKEN_KEY) || "");
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem(REFRESH_TOKEN_KEY) || "");
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState("login");
  const [pendingEmail, setPendingEmail] = useState("");
  const [activeView, setActiveView] = useState(() => routeFromPath(currentPath).view);
  const [language, setLanguage] = useState(() => localStorage.getItem(LANGUAGE_KEY) || "vi");
  const [busy, setBusy] = useState("");
  const [toast, setToast] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedContactId, setSelectedContactId] = useState("");
  const [previewUrls, setPreviewUrls] = useState([]);
  const [review, setReview] = useState(null);
  const [reviewDraft, setReviewDraft] = useState({});
  const [contextDraft, setContextDraft] = useState({});
  const [contacts, setContacts] = useState([]);
  const [digitalCard, setDigitalCard] = useState(null);
  const [publicCard, setPublicCard] = useState(null);
  const [contactQuery, setContactQuery] = useState("");
  const [scanQuery, setScanQuery] = useState("");
  const [uploadFiles, setUploadFiles] = useState({ file: null, file2: null });

  const selectedDocument = documents.find((item) => item.processing_id === selectedId);
  const selectedContact = contacts.find((item) => item.id === selectedContactId);
  const t = useMemo(() => createTranslator(language), [language]);

  const filteredContacts = useMemo(() => {
    const needle = contactQuery.trim().toLowerCase();
    if (!needle) return contacts;
    return contacts.filter((contact) =>
      [
        contact.name,
        contact.company,
        contact.position,
        contact.email,
        contact.phone,
        contact.website,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    );
  }, [contacts, contactQuery]);

  const queueDocuments = useMemo(
    () => documents.filter((doc) => !isProcessedDocument(doc)),
    [documents],
  );

  const filteredDocuments = useMemo(() => {
    const needle = scanQuery.trim().toLowerCase();
    if (!needle) return queueDocuments;
    return queueDocuments.filter((doc) =>
      [doc.processing_id, doc.original_filename, doc.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    );
  }, [queueDocuments, scanQuery]);

  useEffect(() => {
    LEGACY_TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
  }, []);

  useEffect(() => {
    localStorage.setItem(LANGUAGE_KEY, language);
  }, [language]);

  useEffect(() => {
    function handlePopState() {
      setCurrentPath(normalizePath(window.location.pathname));
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const route = routeFromPath(currentPath);
    setActiveView(route.view);
    setSelectedContactId(route.contactId || "");
  }, [currentPath]);

  useEffect(() => {
    if (accessToken && (currentPath === "/" || currentPath === "/login")) {
      navigateTo("/contacts", setCurrentPath);
    }
  }, [accessToken, currentPath]);

  useEffect(() => {
    if (!publicSlug) return;
    fetch(`${API_BASE.replace(/\/$/, "")}/documents/digital-cards/${encodeURIComponent(publicSlug)}/public`)
      .then((response) => response.json())
      .then(setPublicCard)
      .catch(() => setPublicCard({ error: language === "vi" ? "Không tìm thấy thẻ liên hệ." : "Digital card not found." }));
  }, [publicSlug]);

  useEffect(() => {
    if (!accessToken) return;

    async function bootstrapSession() {
      const profile = await loadMe();
      if (profile) {
        await loadDocuments();
        await loadContacts();
        await loadDigitalCard();
      }
    }

    bootstrapSession();
  }, []);

  function notify(message, type = "success") {
    setToast({ message, type });
    window.clearTimeout(notify.timer);
    notify.timer = window.setTimeout(() => setToast(null), 3600);
  }

  function saveTokens(tokens) {
    setAccessToken(tokens.access_token);
    setRefreshToken(tokens.refresh_token);
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
  }

  function clearSession() {
    setAccessToken("");
    setRefreshToken("");
    setUser(null);
    setDocuments([]);
    setContacts([]);
    setSelectedId("");
    setSelectedContactId("");
    setPreviewUrls([]);
    setReview(null);
    setReviewDraft({});
    setContextDraft({});
    setDigitalCard(null);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  async function request(path, options = {}) {
    const token = options.tokenOverride ?? accessToken;
    const headers = {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };
    const { tokenOverride, skipRefresh, ...fetchOptions } = options;

    const response = await fetch(`${API_BASE.replace(/\/$/, "")}${path}`, {
      ...fetchOptions,
      headers,
    });
    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      if (response.status === 401 && refreshToken && !skipRefresh && path !== "/auth/refresh") {
        const tokens = await request("/auth/refresh", {
          method: "POST",
          body: JSON.stringify({ refresh_token: refreshToken }),
          skipRefresh: true,
        });
        saveTokens(tokens);
        return request(path, {
          ...options,
          tokenOverride: tokens.access_token,
          skipRefresh: true,
        });
      }

      const detail = payload?.error?.message || payload?.detail || payload?.message || response.statusText;
      const error = new Error(Array.isArray(detail) ? detail.join(", ") : detail);
      error.status = response.status;
      error.code = payload?.error?.code;
      throw error;
    }
    return payload;
  }

  async function runTask(name, task) {
    setBusy(name);
    try {
      return await task();
    } catch (error) {
      if (error.status === 401 || error.code === "USER_NOT_ACTIVE") {
        clearSession();
        setAuthView(error.code === "USER_NOT_ACTIVE" ? "otp" : "login");
      }
      notify(error.message, "error");
      return null;
    } finally {
      setBusy("");
    }
  }

  async function loadMe(tokenOverride) {
    return runTask("me", async () => {
      const profile = await request("/auth/me", { tokenOverride });
      setUser(profile);
      return profile;
    });
  }

  async function login(form) {
    return runTask("login", async () => {
      const tokens = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });
      saveTokens(tokens);
      notify(t("loginSuccess"));
      await loadMe(tokens.access_token);
      await loadDocuments(tokens.access_token);
      await loadContacts(tokens.access_token);
      await loadDigitalCard(tokens.access_token);
      navigateTo("/contacts", setCurrentPath);
    });
  }

  async function register(form) {
    return runTask("register", async () => {
      const payload = await request("/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setPendingEmail(form.email);
      setAuthView("otp");
      notify(payload.message || t("otpSent"));
    });
  }

  async function verifyOtp(form) {
    return runTask("otp", async () => {
      const payload = await request("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify(form),
      });
      notify(payload.message || t("accountVerified"));
      setAuthView("login");
    });
  }

  async function resendOtp(email) {
    return runTask("resend", async () => {
      const payload = await request("/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      notify(payload.message || t("otpResent"));
    });
  }

  async function logout() {
    if (refreshToken) {
      await runTask("logout", async () => {
        await request("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      });
    }
    clearSession();
    navigateTo("/login", setCurrentPath);
    notify(t("logoutSuccess"));
  }

  async function loadDocuments(tokenOverride) {
    return runTask("documents", async () => {
      const payload = await request("/documents?skip=0&limit=100", { tokenOverride });
      setDocuments(payload.items || []);
      return payload.items || [];
    });
  }

  async function loadContacts(tokenOverride) {
    return runTask("contacts", async () => {
      const payload = await request("/documents/contacts", { tokenOverride });
      setContacts(payload.items || []);
      return payload.items || [];
    });
  }

  async function loadDigitalCard(tokenOverride) {
    return runTask("digital-card", async () => {
      const payload = await request("/documents/digital-card", { tokenOverride });
      setDigitalCard(payload);
      return payload;
    });
  }

  async function createManualContact(form) {
    return runTask("manual-contact", async () => {
      await request("/documents/contacts", {
        method: "POST",
        body: JSON.stringify(normalizeContactPayload(form)),
      });
      notify(t("manualCreated"));
      await loadContacts();
      setContactQuery("");
      navigateTo("/contacts", setCurrentPath);
    });
  }

  async function uploadDocument() {
    if (!uploadFiles.file) {
      notify(t("frontImageRequired"), "error");
      return;
    }

    return runTask("upload", async () => {
      const body = new FormData();
      body.append("file", uploadFiles.file);
      if (uploadFiles.file2) body.append("file2", uploadFiles.file2);
      const payload = await request("/documents", { method: "POST", body });
      notify(t("uploadDone", { id: payload.processing_id }));
      setUploadFiles({ file: null, file2: null });
      await loadDocuments();
      await selectDocument(payload.processing_id);
      navigateTo("/ocr", setCurrentPath);
    });
  }

  async function selectDocument(processingId) {
    setSelectedId(processingId);
    setReview(null);
    setReviewDraft({});
    setContextDraft({});
    setPreviewUrls([]);
    await runTask("preview", async () => {
      const payload = await request(`/documents/${encodeURIComponent(processingId)}/image`);
      setPreviewUrls(payload.urls || []);
    });
  }

  async function loadReview() {
    if (!selectedId) return;
    return runTask("review", async () => {
      const payload = await request(`/documents/${encodeURIComponent(selectedId)}/ocr`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      setReview(payload);
      setReviewDraft(payload.structured_data || {});
      setContextDraft(payload.context_data || {});
      notify(t("ocrDone"));
      await loadDocuments();
    });
  }

  async function saveReviewEdits() {
    if (!selectedId) return;
    return runTask("review-save", async () => {
      const payload = await request(`/documents/${encodeURIComponent(selectedId)}/review`, {
        method: "PATCH",
        body: JSON.stringify({
          updates: normalizeContactPayload(reviewDraft),
          context: normalizeContextPayload(contextDraft),
        }),
      });
      setReview(payload);
      setReviewDraft(payload.structured_data || {});
      setContextDraft(payload.context_data || {});
      notify(t("reviewSaved"));
    });
  }

  async function confirmContact() {
    if (!selectedId) return;
    return runTask("confirm", async () => {
      const payload = await request(`/documents/${encodeURIComponent(selectedId)}/confirm`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      navigateTo("/contacts", setCurrentPath);
      notify(t("contactSaved"));
      await loadContacts();
      await loadDocuments();
    });
  }

  async function deleteDocument() {
    if (!selectedId) return;
    return runTask("delete", async () => {
      await request(`/documents/${encodeURIComponent(selectedId)}`, { method: "DELETE" });
      setDocuments((current) => current.filter((item) => item.processing_id !== selectedId));
      setSelectedId("");
      setPreviewUrls([]);
      setReview(null);
      notify(t("scanDeleted"));
    });
  }

  async function clearQueue() {
    return runTask("queue-clear", async () => {
      const payload = await request("/documents", { method: "DELETE" });
      setDocuments([]);
      setSelectedId("");
      setPreviewUrls([]);
      setReview(null);
      setReviewDraft({});
      setContextDraft({});
      notify(t("queueCleared", { count: payload.deleted_count || 0 }));
    });
  }

  async function deleteContact(contactId) {
    return runTask("contact-delete", async () => {
      await request(`/documents/contacts/${encodeURIComponent(contactId)}`, { method: "DELETE" });
      setContacts((current) => current.filter((contact) => contact.id !== contactId));
      if (selectedContactId === contactId) {
        setSelectedContactId("");
        navigateTo("/contacts", setCurrentPath);
      }
      notify(t("contactDeleted"));
    });
  }

  async function refreshWorkspace() {
    await loadDocuments();
    await loadContacts();
    await loadDigitalCard();
  }

  async function saveDigitalCard(form) {
    return runTask("digital-save", async () => {
      const payload = await request("/documents/digital-card", {
        method: "PUT",
        body: JSON.stringify(normalizeDigitalCardPayload(form)),
      });
      setDigitalCard(payload);
      notify(t("digitalSaved"));
    });
  }

  function navigateView(view, contactId = "") {
    navigateTo(pathForView(view, contactId), setCurrentPath);
  }

  if (publicSlug) {
    return <PublicCardPage card={publicCard} language={language} />;
  }

  if (!accessToken && !isLoginPath) {
    return (
      <LandingPage
        t={t}
        language={language}
        onLanguageChange={setLanguage}
        onStart={() => navigateTo("/login", setCurrentPath)}
      />
    );
  }

  if (!accessToken) {
    return (
      <AuthLayout
        t={t}
        language={language}
        onLanguageChange={setLanguage}
        authView={authView}
        busy={busy}
        pendingEmail={pendingEmail}
        setAuthView={setAuthView}
        setPendingEmail={setPendingEmail}
        onLogin={login}
        onRegister={register}
        onVerifyOtp={verifyOtp}
        onResendOtp={resendOtp}
        toast={toast}
      />
    );
  }

  return (
    <div className="shell">
      <Sidebar
        t={t}
        activeView={activeView}
        user={user}
        contactsCount={contacts.length}
        scansCount={queueDocuments.length}
        onNavigate={navigateView}
        onLogout={logout}
      />
      <main className="main">
        <Topbar
          t={t}
          language={language}
          onLanguageChange={setLanguage}
          activeView={activeView}
          busy={busy}
          user={user}
          onRefresh={refreshWorkspace}
        />
        {activeView === "contacts" && (
          <ContactsView
            t={t}
            contacts={filteredContacts}
            query={contactQuery}
            onQuery={setContactQuery}
            onOpenManual={() => navigateView("manual")}
            onOpenOcr={() => navigateView("ocr")}
            onOpenContact={(contactId) => {
              setSelectedContactId(contactId);
              navigateView("contact-detail", contactId);
            }}
            onRemove={deleteContact}
          />
        )}
        {activeView === "manual" && (
          <ManualContactView
            t={t}
            busy={busy}
            onBack={() => navigateView("contacts")}
            onOpenOcr={() => navigateView("ocr")}
            onCreate={createManualContact}
          />
        )}
        {activeView === "contact-detail" && (
          <ContactDetailView
            t={t}
            contact={selectedContact}
            onBack={() => navigateView("contacts")}
            onOpenOcr={() => navigateView("ocr")}
            onRemove={deleteContact}
          />
        )}
        {activeView === "ocr" && (
          <OcrView
            t={t}
            busy={busy}
            documents={filteredDocuments}
            scanQuery={scanQuery}
            selectedDocument={selectedDocument}
            selectedId={selectedId}
            previewUrls={previewUrls}
            review={review}
            reviewDraft={reviewDraft}
            contextDraft={contextDraft}
            uploadFiles={uploadFiles}
            setUploadFiles={setUploadFiles}
            setReviewDraft={setReviewDraft}
            setContextDraft={setContextDraft}
            onScanQuery={setScanQuery}
            onUpload={uploadDocument}
            onSelect={selectDocument}
            onLoadReview={loadReview}
            onSaveReview={saveReviewEdits}
            onConfirm={confirmContact}
            onDelete={deleteDocument}
            onClearQueue={clearQueue}
          />
        )}
        {activeView === "digital" && (
          <DigitalCardView
            t={t}
            user={user}
            card={digitalCard}
            busy={busy}
            onSave={saveDigitalCard}
          />
        )}
      </main>
      {toast && <Toast toast={toast} />}
    </div>
  );
}

function AuthLayout(props) {
  return (
    <main className="auth-page">
      <section className="auth-art">
        <div className="brand">
          <span className="brand-icon"><BookOpen size={24} /></span>
          <div>
            <h1>Cardly</h1>
            <p>Personal contact OS</p>
          </div>
        </div>
        <div className="auth-copy">
          <Badge tone="success">OCR + Contacts</Badge>
          <h2>{props.language === "vi" ? "Scan danh thiếp, kiểm tra dữ liệu, lưu vào danh bạ." : "Scan cards, review data, save clean contacts."}</h2>
          <p>{props.language === "vi" ? "Một workspace gọn cho xác thực tài khoản, xử lý OCR và quản lý liên hệ cá nhân." : "A focused workspace for account access, OCR processing and personal contact management."}</p>
        </div>
        <div className="auth-stats">
          <Stat label="Storage" value="Cloudinary" />
          <Stat label="OCR" value="Paddle" />
          <Stat label="AI" value="Gemini" />
        </div>
      </section>

      <section className="auth-panel">
        <Card>
          <Card.Header>
            <Card.Title>{authTitle(props.authView, props.t)}</Card.Title>
            <Card.Description>{authDescription(props.authView, props.language)}</Card.Description>
          </Card.Header>
          <Card.Content>
            <Tabs
              value={props.authView}
              onValueChange={props.setAuthView}
              items={[
                { key: "login", label: props.t("login") },
                { key: "register", label: props.t("register") },
                { key: "otp", label: props.t("otp") },
              ]}
            />
            {props.authView === "login" && <LoginForm t={props.t} busy={props.busy} onSubmit={props.onLogin} />}
            {props.authView === "register" && <RegisterForm t={props.t} busy={props.busy} onSubmit={props.onRegister} />}
            {props.authView === "otp" && (
              <OtpForm
                t={props.t}
                busy={props.busy}
                email={props.pendingEmail}
                setEmail={props.setPendingEmail}
                onSubmit={props.onVerifyOtp}
                onResend={props.onResendOtp}
              />
            )}
          </Card.Content>
        </Card>
        <LanguageSwitcher language={props.language} onChange={props.onLanguageChange} />
      </section>
      {props.toast && <Toast toast={props.toast} />}
    </main>
  );
}

function LandingPage({ t, language, onLanguageChange, onStart }) {
  const landingFeatures = language === "vi"
    ? [
        ["Workspace scan", "Upload mặt trước/mặt sau, xem preview và kiểm tra dữ liệu trước khi lưu."],
        ["Tóm tắt thông minh", "Tạo tóm tắt, keywords và highlights để bạn nhớ người đó là ai và vì sao quan trọng."],
        ["Ngữ cảnh liên hệ", "Lưu sự kiện, địa điểm, nguồn, tags và ghi chú cho từng lần gặp."],
        ["Thêm thủ công", "Tạo liên hệ thủ công khi không có danh thiếp hoặc khi cần nhập nhanh sau buổi gặp."],
        ["Thẻ liên hệ số", "Tạo public profile có link và QR để chia sẻ thông tin cá nhân của chính bạn."],
        ["Lưu trữ riêng tư", "Ảnh danh thiếp được giữ lại để review, còn dữ liệu danh bạ nằm trong database của tài khoản."],
      ]
    : [
        ["Scan workspace", "Upload front/back images, preview the card and review data before saving."],
        ["Smart summaries", "Create summaries, keywords and highlights so each contact is easier to remember."],
        ["Contact context", "Save event, location, source, tags and notes for each meeting."],
        ["Manual entry", "Create contacts manually when there is no card or you need a quick entry after a meeting."],
        ["Digital card", "Create a public profile with a link and QR code for sharing your own information."],
        ["Private storage", "Card images stay available for review, while contact data belongs to your account database."],
      ];

  return (
    <main className="landing-page">
      <header className="landing-nav">
        <div className="brand">
          <span className="brand-icon"><BookOpen size={24} /></span>
          <div>
            <h1>Cardly</h1>
            <p>Smart contact forge</p>
          </div>
        </div>
        <div className="landing-nav__actions">
          <LanguageSwitcher language={language} onChange={onLanguageChange} />
          <Button variant="outline" onPress={onStart} startContent={<ShieldCheck size={17} />}>{t("login")}</Button>
        </div>
      </header>

      <section className="landing-hero">
        <div>
          <Badge tone="neutral">OCR · Enrichment · Digital card</Badge>
          <h2>{language === "vi" ? "Biến danh thiếp thành danh bạ thông minh." : "Turn business cards into a smart address book."}</h2>
          <p>
            {language === "vi"
              ? "Cardly giúp scan danh thiếp, trích xuất thông tin, bổ sung insight, lưu ngữ cảnh gặp gỡ và tạo thẻ liên hệ số để chia sẻ khi cần."
              : "Cardly scans business cards, extracts structured data, enriches contacts, preserves meeting context and creates a shareable digital card."}
          </p>
          <div className="button-row">
            <Button variant="primary" onPress={onStart} startContent={<ChevronRight size={17} />}>{language === "vi" ? "Bắt đầu" : "Get started"}</Button>
            <Badge tone="success">{language === "vi" ? "OCR tiếng Việt + tiếng Anh" : "Vietnamese + English OCR"}</Badge>
          </div>
        </div>
        <div className="landing-panel">
          <div className="landing-live">
            <div className="scan-card">
              <span />
              <strong>Business Card</strong>
              <small>name · company · phone · email</small>
              <div className="scan-line" />
            </div>
            <div className="data-stream">
              <span>Name</span>
              <span>Company</span>
              <span>Keywords</span>
              <span>Context</span>
            </div>
          </div>
          <div className="landing-workflow">
            <div className="workflow-head">
              <span>Cardly workflow</span>
              <Badge tone="success">Ready</Badge>
            </div>
            <div className="workflow-row">
              <CloudUpload size={18} />
              <div>
                <strong>Upload business card</strong>
                <small>Front/back images are kept for review.</small>
              </div>
            </div>
            <div className="workflow-row">
              <FileText size={18} />
              <div>
                <strong>OCR + field extraction</strong>
                <small>Name, company, email, phone, website, QR.</small>
              </div>
            </div>
            <div className="workflow-row">
              <ShieldCheck size={18} />
              <div>
                <strong>Review enrichment</strong>
                <small>Brief, keywords, highlights, event context.</small>
              </div>
            </div>
            <div className="workflow-row">
              <ContactRound size={18} />
              <div>
                <strong>Save to contacts</strong>
                <small>Searchable contact record and digital card.</small>
              </div>
            </div>
          </div>
          <div className="landing-metrics">
            <Stat label="Target accuracy" value="90%+" />
            <Stat label="Save time" value="<8s" />
            <Stat label="Languages" value="VI/EN" />
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="section-heading">
          <Badge tone="neutral">{language === "vi" ? "Tổng quan hệ thống" : "System overview"}</Badge>
          <h3>{language === "vi" ? "Một workspace nhỏ cho toàn bộ vòng đời của danh thiếp." : "One workspace for the full business-card lifecycle."}</h3>
          <p>
            {language === "vi"
              ? "Cardly gom các bước rời rạc thành một luồng rõ ràng: lưu ảnh gốc, nhận diện thông tin, kiểm tra lại, thêm ngữ cảnh gặp gỡ, rồi chuyển thành danh bạ có thể tìm kiếm."
              : "Cardly turns scattered steps into one clear flow: save the original image, extract information, review it, add meeting context and create searchable contacts."}
          </p>
        </div>
        <div className="feature-grid">
          {landingFeatures.map(([title, text]) => <FeatureCard key={title} title={title} text={text} />)}
        </div>
      </section>

      <section className="landing-section landing-band">
        <div className="section-heading">
          <Badge tone="neutral">{language === "vi" ? "Cách hoạt động" : "How it works"}</Badge>
          <h3>{language === "vi" ? "Scan một lần, giữ lại đủ dữ liệu để dùng lâu dài." : "Scan once, keep the data useful for the long run."}</h3>
        </div>
        <div className="process-strip">
          <div><CloudUpload size={20} /><span>Upload</span><small>{language === "vi" ? "Lưu ảnh gốc" : "Save original image"}</small></div>
          <div><FileText size={20} /><span>Extract</span><small>{language === "vi" ? "Nhận diện thông tin" : "Capture card details"}</small></div>
          <div><ShieldCheck size={20} /><span>Review</span><small>{language === "vi" ? "Chỉnh dữ liệu và ngữ cảnh" : "Edit fields and context"}</small></div>
          <div><ContactRound size={20} /><span>Save</span><small>{language === "vi" ? "Lưu vào danh bạ" : "Create searchable contact"}</small></div>
          <div><QrCode size={20} /><span>Share</span><small>{language === "vi" ? "Chia sẻ thẻ liên hệ số" : "Share a digital card"}</small></div>
        </div>
      </section>

      <section className="landing-section landing-final">
        <div>
          <h3>{language === "vi" ? "Sẵn sàng xây danh bạ thông minh của riêng bạn." : "Ready to build your own smart address book."}</h3>
          <p>{language === "vi" ? "Bắt đầu bằng một danh thiếp, sau đó để Cardly xử lý phần nhập liệu, enrichment và lưu trữ." : "Start with one card, then let Cardly handle data entry, enrichment and storage."}</p>
        </div>
        <Button variant="primary" onPress={onStart} startContent={<ChevronRight size={17} />}>{t("login")}</Button>
      </section>
    </main>
  );
}

function FeatureCard({ title, text }) {
  return (
    <article className="feature-card">
      <strong>{title}</strong>
      <p>{text}</p>
    </article>
  );
}

function LoginForm({ t, busy, onSubmit }) {
  const [form, setForm] = useState({ email: "", password: "" });
  return (
    <form className="stack" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}>
      <TextField required icon={<Mail size={17} />} label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
      <TextField required label={t("password")} type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} />
      <Button variant="primary" full type="submit" isLoading={busy === "login"} startContent={<ShieldCheck size={18} />}>{t("login")}</Button>
    </form>
  );
}

function RegisterForm({ t, busy, onSubmit }) {
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  return (
    <form className="stack" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}>
      <TextField required label={t("fullName")} value={form.full_name} onChange={(full_name) => setForm({ ...form, full_name })} />
      <TextField required icon={<Mail size={17} />} label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
      <TextField required label={t("password")} type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} />
      <Button variant="primary" full type="submit" isLoading={busy === "register"} startContent={<UserPlus size={18} />}>{t("createAccount")}</Button>
    </form>
  );
}

function OtpForm({ t, busy, email, setEmail, onSubmit, onResend }) {
  const [otp, setOtp] = useState("");
  return (
    <form className="stack" onSubmit={(event) => { event.preventDefault(); onSubmit({ email, otp }); }}>
      <TextField required icon={<Mail size={17} />} label={t("otpEmail")} type="email" value={email} onChange={setEmail} />
      <TextField required icon={<BadgeCheck size={17} />} label={t("otpCode")} value={otp} onChange={setOtp} maxLength={6} />
      <Button variant="primary" full type="submit" isLoading={busy === "otp"} startContent={<BadgeCheck size={18} />}>{t("verifyAccount")}</Button>
      <Button variant="ghost" full type="button" isDisabled={!email || busy === "resend"} onPress={() => onResend(email)}>{t("resendOtp")}</Button>
    </form>
  );
}

function Sidebar({ t, activeView, user, contactsCount, scansCount, onNavigate, onLogout }) {
  const sidebarView = activeView === "contact-detail" ? "contacts" : activeView;

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-icon"><BookOpen size={23} /></span>
        <div>
          <h1>Cardly</h1>
          <p>Contacts Console</p>
        </div>
      </div>

      <div className="profile-card">
        <Avatar value={user?.full_name || user?.email} />
        <div>
          <strong>{user?.full_name || "Cardly user"}</strong>
          <p>{user?.email || t("session")}</p>
        </div>
      </div>

      <nav className="side-nav">
        {views.map((view) => {
          const Icon = view.icon;
          return (
            <button
              key={view.key}
              type="button"
              className={sidebarView === view.key ? "active" : ""}
              onClick={() => onNavigate(view.key)}
            >
              <Icon size={18} />
              {t(view.labelKey)}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-metrics">
        <Stat label={t("contactsMetric")} value={contactsCount} />
        <Stat label={t("scansMetric")} value={scansCount} />
      </div>

      <Button variant="ghost" full onPress={onLogout} startContent={<LogOut size={17} />}>{t("logout")}</Button>
    </aside>
  );
}

function Topbar({ t, activeView, busy, user, language, onLanguageChange, onRefresh }) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">{viewEyebrow(activeView, t)}</p>
        <h2>{viewTitle(activeView, t)}</h2>
      </div>
      <div className="topbar-actions">
        <LanguageSwitcher language={language} onChange={onLanguageChange} />
        <Badge tone={user?.is_active ? "success" : "neutral"}>{user?.is_active ? t("verified") : t("session")}</Badge>
        <Button variant="outline" onPress={onRefresh} isLoading={busy === "documents"} startContent={<RefreshCw size={17} />}>{t("refresh")}</Button>
      </div>
    </header>
  );
}

function ContactsView({ t, contacts, query, onQuery, onOpenManual, onOpenOcr, onOpenContact, onRemove }) {
  return (
    <section className="view-grid contacts-layout workspace-page">
      <Card className="span-12">
        <Card.Header>
          <div>
            <Card.Title>{t("contactsTitle")}</Card.Title>
            <Card.Description>{t("contactsDesc")}</Card.Description>
          </div>
          <div className="button-row">
            <Button variant="outline" onPress={onOpenManual} startContent={<Plus size={17} />}>{t("addManual")}</Button>
            <Button variant="primary" onPress={onOpenOcr} startContent={<Upload size={17} />}>{t("scanNewCard")}</Button>
          </div>
        </Card.Header>
        <Card.Content>
          <Toolbar>
            <TextField icon={<Search size={17} />} label={t("search")} value={query} onChange={onQuery} placeholder={t("searchContactsPlaceholder")} />
            <Badge tone="neutral">{t("contactsCount", { count: contacts.length })}</Badge>
          </Toolbar>
          {contacts.length ? (
            <div className="contact-board">
              {contacts.map((contact) => (
                <ContactCard
                  t={t}
                  key={contact.id}
                  contact={contact}
                  onOpen={() => onOpenContact(contact.id)}
                  onRemove={() => onRemove(contact.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<ContactRound size={28} />}
              title={t("emptyContactsTitle")}
              description={t("emptyContactsDesc")}
            />
          )}
        </Card.Content>
      </Card>
    </section>
  );
}

function ManualContactView({ t, busy, onBack, onOpenOcr, onCreate }) {
  return (
    <section className="view-grid manual-layout workspace-page">
      <Card className="span-8">
        <Card.Header>
          <div>
            <Card.Title>{t("manualTitle")}</Card.Title>
            <Card.Description>{t("manualDesc")}</Card.Description>
          </div>
          <div className="button-row">
            <Button variant="outline" onPress={onBack} startContent={<ArrowLeft size={17} />}>{t("backContacts")}</Button>
            <Button variant="outline" onPress={onOpenOcr} startContent={<Upload size={17} />}>{t("switchOcr")}</Button>
          </div>
        </Card.Header>
        <Card.Content>
          <ManualContactForm t={t} busy={busy} onSubmit={onCreate} />
        </Card.Content>
      </Card>

      <Card className="span-4">
        <Card.Header>
          <Card.Title>{t("manualSourceTitle")}</Card.Title>
          <Card.Description>{t("manualSourceDesc")}</Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="manual-side">
            <Stat label="Storage" value="MongoDB" />
            <Stat label="Images" value="Cloudinary" />
            <Stat label="OCR" value="Optional" />
          </div>
        </Card.Content>
      </Card>
    </section>
  );
}

function ContactDetailView({ t, contact, onBack, onOpenOcr, onRemove }) {
  if (!contact) {
    return (
      <section className="view-grid contact-detail-layout">
        <Card className="span-12">
          <Card.Content>
            <EmptyState
              icon={<ContactRound size={28} />}
              title={t("detailMissingTitle")}
              description={t("detailMissingDesc")}
            />
            <div className="button-row">
              <Button variant="outline" onPress={onBack} startContent={<ArrowLeft size={17} />}>{t("backContacts")}</Button>
              <Button variant="primary" onPress={onOpenOcr} startContent={<Upload size={17} />}>{t("scanNewCard")}</Button>
            </div>
          </Card.Content>
        </Card>
      </section>
    );
  }

  const name = contact.name || t("emptyName");
  const subtitle = [contact.position, contact.company].filter(Boolean).join(" · ") || t("personalContact");
  const socialProfiles = normalizeList(contact.social_profiles);
  const qrCodes = normalizeList(contact.qr_codes);
  const highlights = normalizeList(contact.highlights);
  const tags = normalizeList(contact.tags);
  const keywords = normalizeList(contact.keywords);
  const imageUrls = normalizeList(contact.image_urls);
  const primaryImage = imageUrls[0];

  return (
    <section className="view-grid contact-detail-layout contact-profile-page">
      <Card className="span-12 contact-profile-hero">
        <Card.Content>
          <div className="contact-profile-media">
            {primaryImage ? (
              <a href={primaryImage} target="_blank" rel="noreferrer">
                <img src={primaryImage} alt={`${name} business card`} />
              </a>
            ) : (
              <div className="contact-profile-card-placeholder">
                <QrCode size={30} />
                <span>{t("businessCardImages")}</span>
              </div>
            )}
          </div>

          <div className="contact-profile-main">
            <div className="contact-profile-heading">
              <span className="contact-detail-avatar">{initials(name || contact.company)}</span>
              <div>
                <div className="contact-profile-kicker">
                  <Badge tone="neutral">{contact.source || t("personalContact")}</Badge>
                  {!!imageUrls.length && <Badge tone="success">{t("imagesCount", { count: imageUrls.length })}</Badge>}
                </div>
                <h3>{name}</h3>
                <p>{subtitle}</p>
              </div>
            </div>

            <div className="contact-profile-actions">
              {contact.email && <a href={`mailto:${contact.email}`}><Mail size={17} />Email</a>}
              {contact.phone && <a href={`tel:${contact.phone}`}><Phone size={17} />{t("phone")}</a>}
              {contact.website && <a href={asExternalUrl(contact.website)} target="_blank" rel="noreferrer"><Link size={17} />Website</a>}
            </div>

            <div className="chip-row contact-detail-tags">
              {[...tags, ...keywords].slice(0, 8).map((item) => (
                <Badge key={item} tone="neutral">{item}</Badge>
              ))}
            </div>

            <div className="contact-detail-actions">
              <Button variant="outline" onPress={onBack} startContent={<ArrowLeft size={17} />}>{t("back")}</Button>
              <Button variant="danger" onPress={() => onRemove(contact.id)} startContent={<Trash2 size={17} />}>{t("deleteContact")}</Button>
            </div>
          </div>
        </Card.Content>
      </Card>

      <Card className="span-7">
        <Card.Header>
          <div>
            <Card.Title>{t("contactInfo")}</Card.Title>
            <Card.Description>{t("contactInfoDesc")}</Card.Description>
          </div>
        </Card.Header>
        <Card.Content>
          <dl className="detail-list">
            <DetailRow label="Email" value={contact.email} icon={<Mail size={17} />} type="email" />
            <DetailRow label={t("phone")} value={contact.phone} icon={<Phone size={17} />} type="phone" />
            <DetailRow label="Website" value={contact.website} icon={<Link size={17} />} type="url" />
            <DetailRow label={t("address")} value={contact.address} icon={<MapPin size={17} />} />
            <DetailRow label={t("company")} value={contact.company} />
            <DetailRow label={t("position")} value={contact.position} />
          </dl>
        </Card.Content>
      </Card>

      <Card className="span-5">
        <Card.Header>
          <Card.Title>{t("meetingContext")}</Card.Title>
          <Card.Description>{t("meetingContextDesc")}</Card.Description>
        </Card.Header>
        <Card.Content>
          <dl className="detail-list detail-list--compact">
            <DetailRow label={t("event")} value={contact.event_name} />
            <DetailRow label={t("location")} value={contact.location} />
            <DetailRow label={t("source")} value={contact.source} />
            <DetailRow label="Processing ID" value={contact.processing_id} />
            <DetailRow label={t("confirmedAt")} value={formatDateTime(contact.confirmed_at)} />
          </dl>
        </Card.Content>
      </Card>

      <Card className="span-5">
        <Card.Header>
          <Card.Title>{t("insight")}</Card.Title>
          <Card.Description>{t("insightDesc")}</Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="detail-section">
            <h4>{t("summary")}</h4>
            <p>{contact.professional_brief || contact.notes || t("noSummary")}</p>
          </div>
          <InsightList title={t("highlights")} items={highlights} />
          <InsightList title="Social profiles" items={socialProfiles} />
          <InsightList title="QR codes" items={qrCodes} />
        </Card.Content>
      </Card>

      <Card className="span-7">
        <Card.Header>
          <div>
            <Card.Title>{t("businessCardImages")}</Card.Title>
            <Card.Description>{t("businessCardImagesDesc")}</Card.Description>
          </div>
          <Badge tone={imageUrls.length ? "success" : "neutral"}>{t("imagesCount", { count: imageUrls.length })}</Badge>
        </Card.Header>
        <Card.Content>
          {imageUrls.length ? (
            <div className="business-card-gallery">
              {imageUrls.map((url, index) => (
                <a key={url} className="business-card-image" href={url} target="_blank" rel="noreferrer">
                  <img src={url} alt={`Business card ${index + 1}`} />
                  <span>{index === 0 ? t("frontSide") : t("imageIndex", { count: index + 1 })}</span>
                </a>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<FileText size={26} />}
              title={t("noImageTitle")}
              description={t("noImageDesc")}
            />
          )}
        </Card.Content>
      </Card>
    </section>
  );
}

function ManualContactForm({ t, busy, onSubmit }) {
  const [form, setForm] = useState({
    name: "",
    company: "",
    position: "",
    email: "",
    phone: "",
    website: "",
    event_name: "",
    location: "",
    tags: "",
    notes: "",
  });
  return (
    <form className="stack manual-form" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}>
      <div className="form-grid">
        <TextField label={t("name")} value={form.name} onChange={(name) => setForm({ ...form, name })} />
        <TextField label={t("company")} value={form.company} onChange={(company) => setForm({ ...form, company })} />
        <TextField label={t("position")} value={form.position} onChange={(position) => setForm({ ...form, position })} />
        <TextField icon={<Mail size={17} />} label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
        <TextField label={t("phone")} value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />
        <TextField icon={<Link size={17} />} label="Website" value={form.website} onChange={(website) => setForm({ ...form, website })} />
        <TextField label={t("event")} value={form.event_name} onChange={(event_name) => setForm({ ...form, event_name })} />
        <TextField label={t("location")} value={form.location} onChange={(location) => setForm({ ...form, location })} />
        <TextField label="Tags" value={form.tags} onChange={(tags) => setForm({ ...form, tags })} placeholder="ai, sales, investor" />
        <TextField label={t("notes")} value={form.notes} onChange={(notes) => setForm({ ...form, notes })} />
      </div>
      <Button variant="primary" full type="submit" isLoading={busy === "manual-contact"} startContent={<Plus size={17} />}>{t("createContact")}</Button>
    </form>
  );
}

function OcrView(props) {
  return (
    <section className="view-grid ocr-layout workspace-page">
      <Card className="span-4">
        <Card.Header>
          <Card.Title>{props.t("uploadOcr")}</Card.Title>
          <Card.Description>{props.t("uploadDesc")}</Card.Description>
        </Card.Header>
        <Card.Content>
          <FilePicker label={props.t("uploadFront")} chooseLabel={props.t("chooseImage")} file={props.uploadFiles.file} onChange={(file) => props.setUploadFiles((current) => ({ ...current, file }))} />
          <FilePicker label={props.t("uploadBack")} chooseLabel={props.t("chooseImage")} file={props.uploadFiles.file2} onChange={(file) => props.setUploadFiles((current) => ({ ...current, file2: file }))} />
          <Button variant="primary" full onPress={props.onUpload} isLoading={props.busy === "upload"} startContent={<CloudUpload size={18} />}>{props.t("uploadOcr")}</Button>
        </Card.Content>
      </Card>

      <Card className="span-4">
        <Card.Header>
          <div>
            <Card.Title>{props.t("scanQueue")}</Card.Title>
            <Card.Description>{props.t("scanQueueDesc", { count: props.documents.length })}</Card.Description>
          </div>
          <Button
            variant="danger"
            onPress={props.onClearQueue}
            isDisabled={!props.documents.length}
            isLoading={props.busy === "queue-clear"}
            startContent={<Trash2 size={16} />}
          >
            {props.t("clearQueue")}
          </Button>
        </Card.Header>
        <Card.Content>
          <TextField icon={<Search size={17} />} label={props.t("findScan")} value={props.scanQuery} onChange={props.onScanQuery} placeholder={props.t("scanPlaceholder")} />
          <div className="scan-list">
            {props.documents.length ? props.documents.map((doc) => (
              <button
                key={doc.processing_id}
                type="button"
                className={`scan-item ${props.selectedId === doc.processing_id ? "active" : ""}`}
                onClick={() => props.onSelect(doc.processing_id)}
              >
                <span>
                  <strong>{doc.original_filename || "Business card"}</strong>
                  <small>{doc.processing_id}</small>
                </span>
                <Badge tone={statusTone(doc.status)}>{statusLabel(doc.status)}</Badge>
                <ChevronRight size={16} />
              </button>
            )) : (
              <EmptyState icon={<FileText size={24} />} title={props.t("emptyScansTitle")} description={props.t("emptyScansDesc")} />
            )}
          </div>
        </Card.Content>
      </Card>

      <Card className="span-4">
        <Card.Header>
          <Card.Title>{props.t("preview")}</Card.Title>
          <Card.Description>{props.selectedDocument?.processing_id || props.t("noSelectedScan")}</Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="preview-frame">
            {props.previewUrls.length ? props.previewUrls.map((url) => (
              <img key={url} src={url} alt="Business card preview" />
            )) : (
              <div className="preview-empty">{props.t("previewEmpty")}</div>
            )}
          </div>
        </Card.Content>
      </Card>

      <Card className="span-12">
        <Card.Header>
          <div>
            <Card.Title>{props.t("ocrResult")}</Card.Title>
            <Card.Description>{props.t("ocrResultDesc")}</Card.Description>
          </div>
          <div className="button-row">
            <Button variant="outline" onPress={props.onLoadReview} isDisabled={!props.selectedId} isLoading={props.busy === "review"} startContent={<ShieldCheck size={17} />}>{props.t("runOcr")}</Button>
            <Button variant="primary" onPress={props.onConfirm} isDisabled={!props.review} isLoading={props.busy === "confirm"} startContent={<Check size={17} />}>{props.t("saveContact")}</Button>
            <Button variant="danger" onPress={props.onDelete} isDisabled={!props.selectedId} isLoading={props.busy === "delete"} startContent={<Trash2 size={17} />}>{props.t("deleteScan")}</Button>
          </div>
        </Card.Header>
        <Card.Content>
          <ReviewEditor
            review={props.review}
            data={props.reviewDraft}
            context={props.contextDraft}
            busy={props.busy}
            t={props.t}
            onDataChange={props.setReviewDraft}
            onContextChange={props.setContextDraft}
            onSave={props.onSaveReview}
          />
        </Card.Content>
      </Card>
    </section>
  );
}

function ContactCard({ t, contact, onOpen, onRemove }) {
  const tags = normalizeList(contact.tags);
  const keywords = normalizeList(contact.keywords);

  return (
    <article className="contact-card">
      <button className="contact-card__main" type="button" onClick={onOpen}>
        <Avatar value={contact.name || contact.company || "C"} />
        <div className="contact-card__identity">
          <h3>{contact.name || t("emptyName")}</h3>
          <p>{[contact.position, contact.company].filter(Boolean).join(" · ") || t("noCompany")}</p>
        </div>
        <div className="contact-card__meta">
          <span><Mail size={14} />{contact.email || "-"}</span>
          <span><Phone size={14} />{contact.phone || "-"}</span>
          <span><MapPin size={14} />{[contact.event_name, contact.location].filter(Boolean).join(" · ") || "-"}</span>
        </div>
        <ChevronRight size={18} />
      </button>
      {!!(keywords.length || tags.length) && (
        <div className="contact-card__chips">
          {[...keywords, ...tags].slice(0, 4).map((item) => <Badge key={item} tone="neutral">{item}</Badge>)}
        </div>
      )}
      <button className="icon-action icon-action--danger contact-card__delete" type="button" onClick={onRemove} title={t("deleteContact")}>
        <Trash2 size={16} />
      </button>
    </article>
  );
}

function DetailRow({ label, value, icon, type }) {
  const display = value || "-";
  let content = display;

  if (value && type === "email") {
    content = <a href={`mailto:${value}`}>{value}</a>;
  } else if (value && type === "phone") {
    content = <a href={`tel:${value}`}>{value}</a>;
  } else if (value && type === "url") {
    const href = asExternalUrl(value);
    content = <a href={href} target="_blank" rel="noreferrer">{value}</a>;
  }

  return (
    <div>
      <dt>{icon}{label}</dt>
      <dd>{content}</dd>
    </div>
  );
}

function InsightList({ title, items }) {
  if (!items.length) return null;
  return (
    <div className="detail-section">
      <h4>{title}</h4>
      <ul className="insight-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function asExternalUrl(value) {
  return String(value || "").startsWith("http") ? value : `https://${value}`;
}

function ReviewEditor({ t, review, data, context, busy, onDataChange, onContextChange, onSave }) {
  if (!review) {
    return (
      <EmptyState
        icon={<ShieldCheck size={26} />}
        title={t("reviewEmptyTitle")}
        description={t("reviewEmptyDesc")}
      />
    );
  }

  function fieldValue(name) {
    const value = data?.[name];
    return Array.isArray(value) ? value.join(", ") : value || "";
  }

  return (
    <div className="review-editor">
      <div className="form-grid">
        {REVIEW_FIELDS.map((field) => (
          <TextField
            key={field}
            label={field}
            value={fieldValue(field)}
            onChange={(value) => onDataChange({ ...data, [field]: value })}
          />
        ))}
      </div>
      <div className="context-panel">
        <h4>Context</h4>
        <div className="form-grid">
          {CONTEXT_FIELDS.map((field) => (
            <TextField
              key={field}
              label={field}
              value={Array.isArray(context?.[field]) ? context[field].join(", ") : context?.[field] || ""}
              onChange={(value) => onContextChange({ ...context, [field]: value })}
            />
          ))}
        </div>
      </div>
      <Button variant="outline" onPress={onSave} isLoading={busy === "review-save"} startContent={<Save size={17} />}>
        {t("saveEdits")}
      </Button>
    </div>
  );
}

function DigitalCardView({ t, user, card, busy, onSave }) {
  const [form, setForm] = useState(() => digitalCardForm(card, user));

  useEffect(() => {
    setForm(digitalCardForm(card, user));
  }, [card, user]);

  const displayName = form.full_name || t("yourName");
  const headline = [form.title, form.company].filter(Boolean).join(" · ") || t("titleCompany");
  const highlightItems = splitList(form.highlights);
  const shareUrl = card?.public_url || (form.slug ? `${window.location.origin}/card/${slugify(form.slug)}` : "");

  return (
    <section className="view-grid digital-layout workspace-page">
      <Card className="span-7 digital-editor-card">
        <Card.Header>
          <div>
            <Card.Title>{t("digitalTitle")}</Card.Title>
            <Card.Description>{t("digitalDesc")}</Card.Description>
          </div>
        </Card.Header>
        <Card.Content>
          <form className="digital-form" onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
            <div className="digital-form-section">
              <div className="digital-form-heading">
                <Badge tone="neutral">Profile</Badge>
                <strong>{t("digitalProfileSection")}</strong>
              </div>
              <div className="form-grid">
                <TextField label={t("fullName")} value={form.full_name} onChange={(full_name) => setForm({ ...form, full_name })} />
                <TextField label={t("title")} value={form.title} onChange={(title) => setForm({ ...form, title })} />
                <TextField label={t("company")} value={form.company} onChange={(company) => setForm({ ...form, company })} />
                <TextField label="Photo URL" value={form.photo_url} onChange={(photo_url) => setForm({ ...form, photo_url })} />
              </div>
              <TextField label="Bio" value={form.bio} onChange={(bio) => setForm({ ...form, bio })} />
            </div>

            <div className="digital-form-section">
              <div className="digital-form-heading">
                <Badge tone="neutral">Links</Badge>
                <strong>{t("digitalContactSection")}</strong>
              </div>
              <div className="form-grid">
                <TextField label="Slug" value={form.slug} onChange={(slug) => setForm({ ...form, slug })} />
                <TextField label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
                <TextField label="Phone" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />
                <TextField label="Zalo" value={form.zalo} onChange={(zalo) => setForm({ ...form, zalo })} />
                <TextField label="LinkedIn" value={form.linkedin} onChange={(linkedin) => setForm({ ...form, linkedin })} />
                <TextField label="Website" value={form.website} onChange={(website) => setForm({ ...form, website })} />
              </div>
            </div>

            <div className="digital-form-section">
              <div className="digital-form-heading">
                <Badge tone="neutral">Highlights</Badge>
                <strong>{t("digitalHighlightSection")}</strong>
              </div>
              <TextField label="Highlights" value={form.highlights} onChange={(highlights) => setForm({ ...form, highlights })} placeholder="Founder, AI builder, Speaker" />
            </div>

            <Button variant="primary" type="submit" isLoading={busy === "digital-save"} startContent={<Save size={17} />}>{t("saveDigital")}</Button>
          </form>
        </Card.Content>
      </Card>

      <Card className="span-5 digital-preview-card">
        <Card.Header>
          <div>
            <Card.Title>{t("publicPreview")}</Card.Title>
            <Card.Description>{shareUrl || t("noPublicUrl")}</Card.Description>
          </div>
        </Card.Header>
        <Card.Content>
          <div className="digital-preview">
            <div className="digital-preview-top">
              {form.photo_url ? <img src={form.photo_url} alt={displayName} /> : <Avatar value={displayName} />}
              <Badge tone="success">{t("publicPreview")}</Badge>
            </div>
            <h3>{displayName}</h3>
            <p>{headline}</p>
            <small>{form.bio || t("shortBioPlaceholder")}</small>
            {!!highlightItems.length && (
              <div className="digital-highlight-row">
                {highlightItems.slice(0, 4).map((item) => <Badge key={item} tone="neutral">{item}</Badge>)}
              </div>
            )}
            <div className="digital-contact-actions">
              {form.email && <span><Mail size={15} />Email</span>}
              {form.phone && <span><Phone size={15} />Phone</span>}
              {form.zalo && <span>Zalo</span>}
              {form.linkedin && <span>LinkedIn</span>}
            </div>
            <div className="digital-share-panel">
              <div className="qr-box" dangerouslySetInnerHTML={{ __html: card?.qr_svg || "" }} />
              {shareUrl && <a href={shareUrl} target="_blank" rel="noreferrer">{shareUrl}</a>}
            </div>
          </div>
        </Card.Content>
      </Card>
    </section>
  );
}

function PublicCardPage({ card, language }) {
  if (!card) {
    return (
      <main className="public-card-page">
        <section className="public-card public-card--state">{language === "vi" ? "Đang tải thẻ liên hệ..." : "Loading digital card..."}</section>
      </main>
    );
  }
  if (card.error || card.detail) {
    return (
      <main className="public-card-page">
        <section className="public-card public-card--state">{card.error || card.detail}</section>
      </main>
    );
  }
  const contactLinks = [
    card.phone && { label: "Phone", href: `tel:${card.phone}` },
    card.email && { label: "Email", href: `mailto:${card.email}` },
    card.zalo && { label: "Zalo", href: asExternalUrl(card.zalo) },
    card.linkedin && { label: "LinkedIn", href: asExternalUrl(card.linkedin) },
    card.website && { label: "Website", href: asExternalUrl(card.website) },
  ].filter(Boolean);

  return (
    <main className="public-card-page">
      <section className="public-card">
        <div className="public-card__shine" />
        <header className="public-card__hero">
          {card.photo_url ? <img className="public-photo" src={card.photo_url} alt={card.full_name} /> : <Avatar value={card.full_name} />}
          <div>
            <Badge tone="success">{language === "vi" ? "Thẻ liên hệ" : "Digital card"}</Badge>
            <h1>{card.full_name}</h1>
            <p>{[card.title, card.company].filter(Boolean).join(" · ")}</p>
          </div>
        </header>

        {card.bio && <small className="public-bio">{card.bio}</small>}

        {!!card.highlights?.length && (
          <div className="public-highlights">
            {card.highlights.map((item) => <Badge key={item} tone="neutral">{item}</Badge>)}
          </div>
        )}

        <div className="public-actions">
          {contactLinks.map((link) => (
            <a key={link.label} href={link.href} target={link.href.startsWith("http") ? "_blank" : undefined} rel={link.href.startsWith("http") ? "noreferrer" : undefined}>
              {link.label}
            </a>
          ))}
        </div>

        <footer className="public-card__footer">
          <div>
            <strong>{language === "vi" ? "Quét để lưu liên hệ" : "Scan to save contact"}</strong>
            <span>{window.location.href}</span>
          </div>
          <div className="qr-box" dangerouslySetInnerHTML={{ __html: card.qr_svg || "" }} />
        </footer>
      </section>
    </main>
  );
}

function digitalCardForm(card, user) {
  return {
    slug: card?.slug || slugify(user?.full_name || user?.email || "cardly"),
    full_name: card?.full_name || user?.full_name || "",
    title: card?.title || "",
    company: card?.company || "",
    bio: card?.bio || "",
    photo_url: card?.photo_url || "",
    phone: card?.phone || "",
    email: card?.email || user?.email || "",
    zalo: card?.zalo || "",
    whatsapp: card?.whatsapp || "",
    linkedin: card?.linkedin || "",
    website: card?.website || "",
    highlights: Array.isArray(card?.highlights) ? card.highlights.join(", ") : "",
    is_public: card?.is_public ?? true,
  };
}

function slugify(value) {
  return String(value || "cardly")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "cardly";
}

function normalizePath(pathname) {
  const path = String(pathname || "/").replace(/\/{2,}/g, "/");
  if (
    path === "/login"
    || path === "/contacts"
    || path === "/contacts/new"
    || path === "/ocr"
    || path === "/digital"
    || path.startsWith("/contacts/")
    || path.startsWith("/card/")
  ) return path;
  return path === "/" ? "/" : path;
}

function navigateTo(path, setCurrentPath) {
  const nextPath = normalizePath(path);
  window.history.pushState({}, "", nextPath);
  setCurrentPath(nextPath);
}

function routeFromPath(pathname) {
  const path = normalizePath(pathname);
  if (path === "/contacts/new") return { view: "manual" };
  if (path.startsWith("/contacts/")) {
    return { view: "contact-detail", contactId: decodeURIComponent(path.replace("/contacts/", "")) };
  }
  if (path === "/ocr") return { view: "ocr" };
  if (path === "/digital") return { view: "digital" };
  return { view: "contacts" };
}

function pathForView(view, contactId = "") {
  if (view === "manual") return "/contacts/new";
  if (view === "contact-detail" && contactId) return `/contacts/${encodeURIComponent(contactId)}`;
  if (view === "ocr") return "/ocr";
  if (view === "digital") return "/digital";
  return "/contacts";
}

function normalizeContactPayload(data = {}) {
  return {
    ...data,
    phones: splitList(data.phones || data.phone),
    phone: data.phone,
    social_profiles: splitList(data.social_profiles),
    keywords: splitList(data.keywords),
    highlights: splitList(data.highlights),
    qr_codes: splitList(data.qr_codes),
    tags: splitList(data.tags),
  };
}

function normalizeContextPayload(data = {}) {
  return {
    ...data,
    tags: splitList(data.tags),
  };
}

function normalizeDigitalCardPayload(data = {}) {
  return {
    ...data,
    slug: slugify(data.slug),
    highlights: splitList(data.highlights),
  };
}

function splitList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value)
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function Card({ children, className = "" }) {
  return <section className={`card ${className}`}>{children}</section>;
}

Card.Header = function CardHeader({ children }) {
  return <header className="card__header">{children}</header>;
};

Card.Title = function CardTitle({ children }) {
  return <h3 className="card__title">{children}</h3>;
};

Card.Description = function CardDescription({ children }) {
  return <p className="card__description">{children}</p>;
};

Card.Content = function CardContent({ children }) {
  return <div className="card__content">{children}</div>;
};

function Button({
  children,
  variant = "secondary",
  full = false,
  type = "button",
  isLoading = false,
  isDisabled = false,
  startContent,
  onPress,
}) {
  return (
    <button
      type={type}
      className={`button button--${variant} ${full ? "button--full" : ""}`}
      disabled={isDisabled || isLoading}
      onClick={onPress}
    >
      {isLoading ? <Loader2 className="spin" size={17} /> : startContent}
      {children}
    </button>
  );
}

function TextField({ label, value, onChange, icon, type = "text", placeholder = "", maxLength, required = false }) {
  return (
    <label className="text-field">
      <span>{label}</span>
      <div className="text-field__control">
        {icon}
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
          required={required}
        />
      </div>
    </label>
  );
}

function Tabs({ value, onValueChange, items }) {
  return (
    <div className="tabs">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          className={value === item.key ? "active" : ""}
          onClick={() => onValueChange(item.key)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function Badge({ children, tone = "neutral" }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

function LanguageSwitcher({ language, onChange }) {
  return (
    <div className="language-switch" aria-label="Language">
      <Languages size={16} />
      <button type="button" className={language === "vi" ? "active" : ""} onClick={() => onChange("vi")}>VI</button>
      <button type="button" className={language === "en" ? "active" : ""} onClick={() => onChange("en")}>EN</button>
    </div>
  );
}

function FilePicker({ label, chooseLabel = "Choose image", file, onChange }) {
  return (
    <label className="file-picker">
      <span>{label}</span>
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => onChange(event.target.files?.[0] || null)} />
      <strong>{file?.name || chooseLabel}</strong>
    </label>
  );
}

function Toolbar({ children }) {
  return <div className="toolbar">{children}</div>;
}

function EmptyState({ icon, title, description }) {
  return (
    <div className="empty-state">
      {icon}
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

function Avatar({ value = "" }) {
  return <span className="avatar">{initials(value)}</span>;
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function Toast({ toast }) {
  return <div className={`toast toast--${toast.type}`}>{toast.message}</div>;
}

function authTitle(view, t) {
  if (view === "register") return t("createAccount");
  if (view === "otp") return t("verifyAccount");
  return t("login");
}

function authDescription(view, language) {
  if (language === "en") {
    if (view === "register") return "Create an account and receive an OTP by email.";
    if (view === "otp") return "Enter the 6-digit code to activate your account.";
    return "Access your contacts and OCR workspace.";
  }
  if (view === "register") return "Tạo tài khoản và nhận mã OTP qua email.";
  if (view === "otp") return "Nhập mã 6 chữ số để kích hoạt tài khoản.";
  return "Truy cập danh bạ và workspace OCR của bạn.";
}

function viewTitle(view, t) {
  if (view === "contact-detail") return t("viewDetail");
  if (view === "manual") return t("viewManual");
  if (view === "ocr") return t("viewOcr");
  if (view === "digital") return t("viewDigital");
  return t("viewContacts");
}

function viewEyebrow(view, t) {
  if (view === "contact-detail") return t("eyebrowDetail");
  if (view === "manual") return t("eyebrowManual");
  if (view === "ocr") return t("eyebrowOcr");
  if (view === "digital") return t("eyebrowDigital");
  return t("eyebrowContacts");
}

function statusTone(status) {
  if (status === "processed") return "success";
  if (status === "failed" || status?.startsWith("rejected")) return "danger";
  if (status === "preprocessing") return "warning";
  return "neutral";
}

function statusLabel(status = "received") {
  const labels = {
    received: "Received",
    validated: "Validated",
    preprocessing: "Processing",
    processed: "Processed",
    failed: "Failed",
    rejected_invalid: "Rejected",
    rejected_duplicate: "Duplicate",
  };
  return labels[status] || status;
}

function isProcessedDocument(doc = {}) {
  return ["processed", "confirmed"].includes(doc.status);
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (!value) return [];
  return String(value)
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function createTranslator(language) {
  const dictionary = I18N[language] || I18N.vi;
  return (key, values = {}) => {
    const template = dictionary[key] ?? I18N.vi[key] ?? key;
    return Object.entries(values).reduce(
      (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
      template,
    );
  };
}

function initials(value = "") {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "C";
}

export default App;
