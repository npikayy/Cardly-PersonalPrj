import {
  Button as HeroButton,
  Card as HeroCard,
  Chip as HeroChip,
} from "@heroui/react";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  CloudUpload,
  ContactRound,
  Download,
  FileText,
  Globe2,
  HelpCircle,
  Languages,
  Layers,
  Link,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Eye,
  EyeOff,
  Pencil,
  Phone,
  Plus,
  QrCode,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  UserPlus,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

const ACCESS_TOKEN_KEY = "cardly.accessToken.v2";
const REFRESH_TOKEN_KEY = "cardly.refreshToken.v2";
const LANGUAGE_KEY = "cardly.language";
const PENDING_OTP_EMAIL_KEY = "cardly.pendingOtpEmail";
const PENDING_OTP_EMAILS_KEY = "cardly.pendingOtpEmails";
const WELCOME_DISMISSED_PREFIX = "cardly.welcomeDismissed";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
const LEGACY_TOKEN_KEYS = ["cardly.accessToken", "cardly.refreshToken"];
const BRAND_LOGO_URL = "https://res.cloudinary.com/dujgxdchz/image/upload/v1785481436/ChatGPT_Image_13_59_15_31_thg_7_2026_hztqii.png";

const views = [
  { key: "contacts", labelKey: "navContacts", icon: ContactRound },
  { key: "manual", labelKey: "navManual", icon: UserPlus },
  { key: "qr-contact", labelKey: "navQrContact", icon: QrCode },
  { key: "ocr", labelKey: "navOcr", icon: FileText },
  { key: "digital", labelKey: "navDigital", icon: QrCode },
];

const I18N = {
  vi: {
    navContacts: "Danh bạ",
    navManual: "Thêm liên hệ",
    navQrContact: "Quét QR",
    navOcr: "Quét danh thiếp",
    navDigital: "Thẻ số",
    login: "Đăng nhập",
    register: "Đăng ký",
    otp: "OTP",
    logout: "Đăng xuất",
    refresh: "Làm mới",
    instructionButton: "Hướng dẫn",
    verified: "Đã xác thực",
    session: "Phiên làm việc",
    contactsMetric: "Liên hệ",
    scansMetric: "Bản scan",
    contactsTitle: "Danh bạ đã lưu",
    contactsDesc: "Các liên hệ đã xác nhận từ ảnh danh thiếp hoặc được thêm thủ công.",
    contactsHeroTitle: "Không gian quản lý quan hệ của bạn",
    contactsHeroDesc: "Tìm, mở và chăm sóc từng liên hệ từ danh thiếp trong một giao diện gọn gàng, có ngữ cảnh.",
    quickCapture: "Scan nhanh",
    curatedList: "Danh sách tinh gọn",
    latestContact: "Liên hệ gần đây",
    addManual: "Thêm thủ công",
    scanNewCard: "Scan danh thiếp",
    search: "Tìm kiếm",
    searchContactsPlaceholder: "Tên, công ty, email, số điện thoại",
    contactsCount: "{count} liên hệ",
    emptyContactsTitle: "Chưa có liên hệ nào",
    emptyContactsDesc: "Sau khi scan và xác nhận danh thiếp, liên hệ sẽ xuất hiện tại đây.",
    manualTitle: "Thêm liên hệ thủ công",
    manualDesc: "Tạo nhanh một liên hệ khi bạn chưa có ảnh danh thiếp.",
    qrContactTitle: "Lưu liên hệ từ QR Cardly",
    qrContactDesc: "Upload ảnh mã QR chứa link thẻ số Cardly để lưu nhanh người đó vào danh bạ.",
    qrContactUpload: "Ảnh mã QR",
    qrContactButton: "Lưu liên hệ từ QR",
    qrContactSaved: "Đã lưu liên hệ từ QR.",
    qrBundleSaved: "Đã lưu {count} liên hệ từ QR bundle.",
    qrContactRequired: "Vui lòng chọn ảnh QR trước.",
    qrContactHint: "QR hợp lệ là mã được tải từ thẻ số hoặc trang chi tiết danh bạ của Cardly.",
    selectContacts: "Chọn liên hệ",
    shareSelected: "Chia sẻ đã chọn",
    bundleCreated: "Đã tạo QR bundle.",
    bundleQrTitle: "QR bundle",
    bundleQrDesc: "Quét mã này để lưu nhiều liên hệ cùng lúc.",
    downloadBundleQr: "Tải QR bundle",
    openBundlePage: "Xem bundle",
    selectedContacts: "{count} liên hệ đã chọn",
    recentBundles: "Bundle đã tạo gần đây",
    recentBundlesDesc: "Bạn có thể tải lại QR bundle sau khi reload trang.",
    hideBundleTools: "Ẩn QR bundle",
    showBundleTools: "Hiện QR bundle",
    manualHeroTitle: "Ghi lại liên hệ mới trong vài thao tác",
    manualHeroDesc: "Phù hợp cho cuộc gặp nhanh, cuộc gọi hoặc những liên hệ chưa có ảnh danh thiếp.",
    backContacts: "Về danh bạ",
    switchOcr: "Chuyển sang quét danh thiếp",
    manualSourceTitle: "Nguồn dữ liệu",
    manualSourceDesc: "Liên hệ thủ công dùng chung danh bạ với liên hệ từ ảnh danh thiếp.",
    noImageTitle: "Liên hệ này chưa có ảnh danh thiếp",
    noImageDesc: "Liên hệ thêm thủ công hoặc bản scan cũ có thể không còn ảnh gốc.",
    detailMissingTitle: "Không tìm thấy liên hệ",
    detailMissingDesc: "Liên hệ này có thể đã bị xoá hoặc danh bạ vừa được làm mới.",
    back: "Quay lại",
    deleteContact: "Xoá liên hệ",
    editContact: "Chỉnh sửa",
    cancelEdit: "Huỷ chỉnh sửa",
    contactUpdated: "Đã cập nhật liên hệ.",
    contactInfo: "Thông tin liên hệ",
    contactInfoDesc: "Chi tiết được lưu từ ảnh danh thiếp hoặc nhập thủ công.",
    meetingContext: "Ngữ cảnh gặp gỡ",
    meetingContextDesc: "Nguồn, sự kiện và ghi chú gắn với liên hệ.",
    insight: "Gợi ý & ghi chú",
    insightDesc: "Tóm tắt, QR và các ghi chú bổ sung.",
    summary: "Tóm tắt",
    noSummary: "Chưa có ghi chú hoặc tóm tắt.",
    highlights: "Điểm nổi bật",
    businessCardImages: "Ảnh danh thiếp",
    businessCardImagesDesc: "Ảnh gốc đã lưu trên Cloudinary trước khi đọc thông tin.",
    imagesCount: "{count} ảnh",
    frontSide: "Mặt trước",
    imageIndex: "Ảnh {count}",
    createContact: "Tạo liên hệ",
    uploadFront: "Ảnh mặt trước",
    uploadBack: "Ảnh mặt sau",
    chooseImage: "Chọn ảnh",
    uploadOcr: "Upload danh thiếp",
    scanQueue: "Hàng đợi scan",
    scanQueueDesc: "{count} bản ghi đang hiển thị.",
    clearQueue: "Xoá hàng đợi",
    findScan: "Tìm scan",
    scanPlaceholder: "Processing ID, file, trạng thái",
    emptyScansTitle: "Chưa có bản scan",
    emptyScansDesc: "Upload ảnh để tạo bản scan danh thiếp.",
    preview: "Xem trước",
    noSelectedScan: "Chưa chọn bản scan",
    previewEmpty: "Chọn một bản scan để xem ảnh.",
    ocrResult: "Kết quả quét danh thiếp",
    ocrResultDesc: "Đọc thông tin từ ảnh, kiểm tra dữ liệu, rồi lưu vào danh bạ.",
    runOcr: "Đọc danh thiếp",
    saveContact: "Lưu vào danh bạ",
    deleteScan: "Xoá scan",
    digitalTitle: "Thẻ liên hệ số",
    digitalDesc: "Hồ sơ công khai để chia sẻ bằng link hoặc QR.",
    digitalHeroTitle: "Thiết kế danh thiếp số của riêng bạn",
    digitalHeroDesc: "Tạo một hồ sơ gọn, đẹp và dễ chia sẻ sau mỗi cuộc gặp.",
    saveDigital: "Lưu thẻ số",
    publicPreview: "Xem trước công khai",
    noPublicUrl: "Chưa tạo public URL",
    openPublicCard: "Mở thẻ công khai",
    downloadQr: "Tải mã QR",
    qrNotReady: "Mã QR chưa sẵn sàng.",
    viewContacts: "Quản lý danh bạ",
    viewManual: "Thêm liên hệ",
    viewDetail: "Chi tiết liên hệ",
    viewOcr: "Quét danh thiếp",
    viewDigital: "Thẻ liên hệ số",
    eyebrowContacts: "Danh bạ",
    eyebrowManual: "Nhập thủ công",
    eyebrowDetail: "Danh bạ",
    eyebrowOcr: "Scan & review",
    eyebrowDigital: "Public profile",
    name: "Tên",
    fullName: "Họ tên",
    title: "Chức vụ",
    company: "Công ty",
    position: "Chức vụ",
    phone: "Số điện thoại",
    address: "Địa chỉ",
    event: "Sự kiện",
    location: "Địa điểm",
    source: "Nguồn",
    digitalNotes: "Ghi chú công khai",
    confirmedAt: "Xác nhận lúc",
    emptyName: "Chưa có tên",
    personalContact: "Liên hệ cá nhân",
    noCompany: "Chưa có công ty",
    uploadDesc: "Hỗ trợ ảnh mặt trước và mặt sau.",
    reviewEmptyTitle: "Chưa có dữ liệu quét",
    reviewEmptyDesc: "Chọn một bản scan trong hàng đợi rồi đọc danh thiếp để xem dữ liệu trích xuất.",
    saveEdits: "Lưu chỉnh sửa",
    yourName: "Tên của bạn",
    titleCompany: "Chức vụ · Công ty",
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
    ocrDone: "Đã đọc xong danh thiếp, dữ liệu review đã sẵn sàng.",
    ocrRunningTitle: "Đang đọc danh thiếp",
    ocrRunningDesc: "Hệ thống đang đọc ảnh, trích xuất thông tin và chuẩn bị dữ liệu review.",
    ocrProgress: "Tiến trình đọc danh thiếp",
    reviewSaved: "Đã lưu chỉnh sửa review.",
    contactSaved: "Đã lưu vào danh bạ.",
    scanDeleted: "Đã xoá bản scan.",
    queueCleared: "Đã xoá {count} bản scan trong hàng đợi.",
    contactDeleted: "Đã xoá liên hệ.",
    digitalSaved: "Đã lưu thẻ số.",
    profileUpdated: "Đã cập nhật ảnh đại diện.",
    updateAvatar: "Cập nhật ảnh đại diện",
    avatarPanelTitle: "Ảnh đại diện",
    avatarPanelDesc: "Ảnh này sẽ xuất hiện ở sidebar và trên thẻ liên hệ số công khai.",
    avatarUrl: "Ảnh đại diện",
    avatarUrlPlaceholder: "Dán URL ảnh đại diện",
    avatarFile: "Ảnh từ máy",
    chooseAvatar: "Chọn ảnh đại diện",
    uploadAvatarFile: "Upload ảnh từ máy",
    avatarSourceUrl: "Dùng URL",
    avatarSourceFile: "Dùng ảnh trên máy",
    recentAvatars: "Ảnh đã dùng gần đây",
    recentAvatarsDesc: "Chọn nhanh một trong 5 ảnh đại diện gần nhất.",
    avatarDeleted: "Đã xóa ảnh đại diện.",
    uploadDone: "Đã upload {id}.",
    uploadRunningTitle: "Đang upload ảnh",
    uploadRunningDesc: "Ảnh danh thiếp đang được tải lên khu vực quét.",
    uploadProgress: "Tiến trình upload",
    welcomeTitle: "Chào mừng trở lại, {name}",
    welcomeDesc: "Cardly là không gian làm việc cá nhân để bạn scan danh thiếp, kiểm tra dữ liệu, lưu ngữ cảnh gặp gỡ và biến mỗi kết nối thành một liên hệ dễ tìm lại.",
    welcomeKicker: "Workspace của bạn đã sẵn sàng",
    welcomePreviewTitle: "Các tính năng chính",
    welcomeFooter: "Cardly gom toàn bộ luồng quản lý liên hệ vào một nơi.",
    welcomeFeatureContacts: "Danh bạ tập trung",
    welcomeFeatureContactsDesc: "Tìm kiếm, xem chi tiết, chỉnh sửa và quản lý ngữ cảnh của từng liên hệ.",
    welcomeFeatureOcr: "Quét danh thiếp",
    welcomeFeatureOcrDesc: "Upload ảnh danh thiếp, đọc dữ liệu, kiểm tra kết quả rồi lưu thành liên hệ sạch.",
    welcomeFeatureQr: "Chia sẻ bằng QR",
    welcomeFeatureQrDesc: "Tạo QR cho từng contact hoặc bundle nhiều contact để người khác lưu nhanh.",
    welcomeFeatureDigital: "Thẻ liên hệ số",
    welcomeFeatureDigitalDesc: "Tạo hồ sơ công khai, cập nhật thông tin cá nhân và chia sẻ bằng link hoặc QR.",
    welcomeStart: "Bắt đầu sử dụng",
    welcomeDoNotShow: "Không hiện lại",
    digitalProfileSection: "Thông tin hiển thị",
    digitalContactSection: "Kênh liên hệ",
    digitalHighlightSection: "Điểm nổi bật trên thẻ",
    digitalMoreSection: "Thông tin bổ sung",
    professionalBrief: "Giới thiệu chuyên môn",
    socialProfiles: "Hồ sơ mạng xã hội",
    keywords: "Từ khóa",
    tags: "Nhãn",
    notes: "Ghi chú",
    zaloPhone: "Số điện thoại Zalo",
    zaloPhonePlaceholder: "Ví dụ: 0123456789",
    confirmTitle: "Xác nhận thao tác",
    confirmCancel: "Huỷ",
    confirmDelete: "Xoá",
    confirmSave: "Lưu",
    confirmUpdate: "Cập nhật",
    confirmCreateContactTitle: "Tạo liên hệ mới?",
    confirmCreateContactDesc: "Liên hệ này sẽ được lưu vào danh bạ của bạn.",
    confirmUpdateContactTitle: "Lưu chỉnh sửa liên hệ?",
    confirmUpdateContactDesc: "Thông tin hiện tại của liên hệ sẽ được cập nhật.",
    confirmDeleteContactTitle: "Xoá liên hệ này?",
    confirmDeleteContactDesc: "Liên hệ sẽ bị xoá khỏi danh bạ. Thao tác này không thể hoàn tác.",
    confirmDeleteAvatarTitle: "Xóa ảnh đại diện này?",
    confirmDeleteAvatarDesc: "Ảnh sẽ bị xóa khỏi Cloudinary và không còn xuất hiện trong danh sách gần đây.",
    confirmDeleteScanTitle: "Xoá bản scan này?",
    confirmDeleteScanDesc: "Ảnh và dữ liệu đã đọc liên quan đến bản scan sẽ bị xoá khỏi hàng đợi.",
    confirmClearQueueTitle: "Xoá toàn bộ hàng đợi?",
    confirmClearQueueDesc: "Tất cả bản scan đang chờ xử lý sẽ bị xoá.",
    confirmReviewSaveTitle: "Lưu chỉnh sửa dữ liệu quét?",
    confirmReviewSaveDesc: "Dữ liệu review hiện tại sẽ được cập nhật trước khi lưu vào danh bạ.",
    confirmSaveContactTitle: "Lưu vào danh bạ?",
    confirmSaveContactDesc: "Bản scan đã review sẽ trở thành một liên hệ chính thức trong danh bạ.",
    confirmDigitalSaveTitle: "Lưu thẻ số?",
    confirmDigitalSaveDesc: "Thông tin thẻ liên hệ số công khai sẽ được cập nhật.",
  },
  en: {
    navContacts: "Contacts",
    navManual: "Add contact",
    navQrContact: "Scan QR",
    navOcr: "Scan card",
    navDigital: "Digital card",
    login: "Log in",
    register: "Register",
    otp: "OTP",
    logout: "Log out",
    refresh: "Refresh",
    instructionButton: "Guide",
    verified: "Verified",
    session: "Session",
    contactsMetric: "Contacts",
    scansMetric: "Scans",
    contactsTitle: "Saved contacts",
    contactsDesc: "Contacts confirmed from card scans or added manually.",
    contactsHeroTitle: "Your relationship workspace",
    contactsHeroDesc: "Find, open and nurture every business-card contact in one focused, contextual interface.",
    quickCapture: "Quick scan",
    curatedList: "Curated roster",
    latestContact: "Latest contact",
    addManual: "Add manually",
    scanNewCard: "Scan card",
    search: "Search",
    searchContactsPlaceholder: "Name, company, email, phone",
    contactsCount: "{count} contacts",
    emptyContactsTitle: "No contacts yet",
    emptyContactsDesc: "After you scan and confirm a business card, the contact will appear here.",
    manualTitle: "Add contact manually",
    manualDesc: "Create a contact quickly when you do not have a business-card image.",
    qrContactTitle: "Save contact from Cardly QR",
    qrContactDesc: "Upload a QR image containing a Cardly digital-card or shared-contact link to save that person to contacts.",
    qrContactUpload: "QR image",
    qrContactButton: "Save contact from QR",
    qrContactSaved: "Contact saved from QR.",
    qrBundleSaved: "Saved {count} contacts from QR bundle.",
    qrContactRequired: "Please choose a QR image first.",
    qrContactHint: "A valid QR is downloaded from a Cardly digital card or contact detail page.",
    selectContacts: "Select contacts",
    shareSelected: "Share selected",
    bundleCreated: "QR bundle created.",
    bundleQrTitle: "QR bundle",
    bundleQrDesc: "Scan this code to save multiple contacts at once.",
    downloadBundleQr: "Download bundle QR",
    openBundlePage: "View bundle",
    selectedContacts: "{count} selected contacts",
    recentBundles: "Recent bundles",
    recentBundlesDesc: "Download bundle QR codes again after reloading the page.",
    hideBundleTools: "Hide QR bundle",
    showBundleTools: "Show QR bundle",
    manualHeroTitle: "Capture a new contact in a few fields",
    manualHeroDesc: "Useful for quick meetings, calls, or contacts without a business-card image.",
    backContacts: "Back to contacts",
    switchOcr: "Go to card scanning",
    manualSourceTitle: "Data source",
    manualSourceDesc: "Manual contacts live in the same address book as scanned-card contacts.",
    noImageTitle: "This contact has no business-card image",
    noImageDesc: "Manual contacts or older scans may not have an original image attached.",
    detailMissingTitle: "Contact not found",
    detailMissingDesc: "This contact may have been deleted or the address book was refreshed.",
    back: "Back",
    deleteContact: "Delete contact",
    editContact: "Edit",
    cancelEdit: "Cancel edit",
    contactUpdated: "Contact updated.",
    contactInfo: "Contact information",
    contactInfoDesc: "Details saved from a card scan or entered manually.",
    meetingContext: "Meeting context",
    meetingContextDesc: "Source, event and notes attached to this contact.",
    insight: "Insights & notes",
    insightDesc: "Summary, QR codes and additional notes.",
    summary: "Summary",
    noSummary: "No notes or summary yet.",
    highlights: "Highlights",
    businessCardImages: "Business-card images",
    businessCardImagesDesc: "Original Cloudinary images saved before reading card details.",
    imagesCount: "{count} images",
    frontSide: "Front side",
    imageIndex: "Image {count}",
    createContact: "Create contact",
    uploadFront: "Front image",
    uploadBack: "Back image",
    chooseImage: "Choose image",
    uploadOcr: "Upload card",
    scanQueue: "Scan queue",
    scanQueueDesc: "{count} records shown.",
    clearQueue: "Clear queue",
    findScan: "Find scan",
    scanPlaceholder: "Processing ID, file, status",
    emptyScansTitle: "No scans yet",
    emptyScansDesc: "Upload an image to create a card scan.",
    preview: "Preview",
    noSelectedScan: "No scan selected",
    previewEmpty: "Select a scan to preview the image.",
    ocrResult: "Card scan result",
    ocrResultDesc: "Read details from the image, review the data, then save it to contacts.",
    runOcr: "Read card",
    saveContact: "Save contact",
    deleteScan: "Delete scan",
    digitalTitle: "Digital contact card",
    digitalDesc: "A public profile for sharing with a link or QR code.",
    digitalHeroTitle: "Design your own digital card",
    digitalHeroDesc: "Create a compact, polished profile that is easy to share after every meeting.",
    saveDigital: "Save digital card",
    publicPreview: "Public preview",
    noPublicUrl: "No public URL yet",
    openPublicCard: "Open public card",
    downloadQr: "Download QR",
    qrNotReady: "QR code is not ready.",
    viewContacts: "Contact management",
    viewManual: "Add contact",
    viewDetail: "Contact details",
    viewOcr: "Card scanning",
    viewDigital: "Digital contact card",
    eyebrowContacts: "Contacts",
    eyebrowManual: "Manual entry",
    eyebrowDetail: "Contacts",
    eyebrowOcr: "Scan & review",
    eyebrowDigital: "Public profile",
    name: "Name",
    fullName: "Full name",
    title: "Position",
    company: "Company",
    position: "Position",
    phone: "Phone",
    address: "Address",
    event: "Event",
    location: "Location",
    source: "Source",
    digitalNotes: "Public notes",
    confirmedAt: "Confirmed at",
    emptyName: "Unnamed contact",
    personalContact: "Personal contact",
    noCompany: "No company yet",
    uploadDesc: "Supports front and back images.",
    reviewEmptyTitle: "No scan data loaded",
    reviewEmptyDesc: "Select a scan from the queue, then read the card to see extracted fields.",
    saveEdits: "Save edits",
    yourName: "Your name",
    titleCompany: "Position · Company",
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
    ocrDone: "Card reading complete. Review data is ready.",
    ocrRunningTitle: "Reading card",
    ocrRunningDesc: "The system is reading the image, extracting details and preparing review data.",
    ocrProgress: "Card reading progress",
    reviewSaved: "Review edits saved.",
    contactSaved: "Saved to contacts.",
    scanDeleted: "Scan deleted.",
    queueCleared: "Cleared {count} scans from the queue.",
    contactDeleted: "Contact deleted.",
    digitalSaved: "Digital card saved.",
    profileUpdated: "Avatar updated.",
    updateAvatar: "Update avatar",
    avatarPanelTitle: "Avatar",
    avatarPanelDesc: "This image appears in the sidebar and on your public digital contact card.",
    avatarUrl: "Avatar",
    avatarUrlPlaceholder: "Paste your avatar image URL",
    avatarFile: "Image from device",
    chooseAvatar: "Choose avatar image",
    uploadAvatarFile: "Upload from device",
    avatarSourceUrl: "Use URL",
    avatarSourceFile: "Import image",
    recentAvatars: "Recent avatars",
    recentAvatarsDesc: "Quickly reuse one of your 5 most recent avatars.",
    avatarDeleted: "Avatar deleted.",
    uploadDone: "Uploaded {id}.",
    uploadRunningTitle: "Uploading images",
    uploadRunningDesc: "Business-card images are being uploaded to the scan workspace.",
    uploadProgress: "Upload progress",
    welcomeTitle: "Welcome back, {name}",
    welcomeDesc: "Cardly is your personal workspace for scanning business cards, reviewing data, preserving meeting context and turning every connection into a contact you can find again.",
    welcomeKicker: "Your workspace is ready",
    welcomePreviewTitle: "Key features",
    welcomeFooter: "Cardly keeps your contact workflow in one place.",
    welcomeFeatureContacts: "Centralized contacts",
    welcomeFeatureContactsDesc: "Search, inspect, edit and manage context for each saved contact.",
    welcomeFeatureOcr: "Business-card scanning",
    welcomeFeatureOcrDesc: "Upload card images, extract details, review the result and save clean contacts.",
    welcomeFeatureQr: "QR sharing",
    welcomeFeatureQrDesc: "Create QR codes for individual contacts or multi-contact bundles.",
    welcomeFeatureDigital: "Digital contact card",
    welcomeFeatureDigitalDesc: "Create a public profile, update personal details and share it by link or QR.",
    welcomeStart: "Start using Cardly",
    welcomeDoNotShow: "Do not show again",
    digitalProfileSection: "Display profile",
    digitalContactSection: "Contact channels",
    digitalHighlightSection: "Card highlights",
    digitalMoreSection: "Additional details",
    professionalBrief: "Professional brief",
    socialProfiles: "Social profiles",
    keywords: "Keywords",
    tags: "Tags",
    notes: "Notes",
    zaloPhone: "Zalo phone number",
    zaloPhonePlaceholder: "Example: 0123456789",
    confirmTitle: "Confirm action",
    confirmCancel: "Cancel",
    confirmDelete: "Delete",
    confirmSave: "Save",
    confirmUpdate: "Update",
    confirmCreateContactTitle: "Create this contact?",
    confirmCreateContactDesc: "This contact will be saved to your address book.",
    confirmUpdateContactTitle: "Save contact changes?",
    confirmUpdateContactDesc: "The current contact information will be updated.",
    confirmDeleteContactTitle: "Delete this contact?",
    confirmDeleteContactDesc: "This contact will be removed from your address book. This cannot be undone.",
    confirmDeleteAvatarTitle: "Delete this avatar?",
    confirmDeleteAvatarDesc: "The image will be removed from Cloudinary and from your recent avatars.",
    confirmDeleteScanTitle: "Delete this scan?",
    confirmDeleteScanDesc: "The image and extracted data attached to this scan will be removed from the queue.",
    confirmClearQueueTitle: "Clear the whole queue?",
    confirmClearQueueDesc: "All pending scan records will be deleted.",
    confirmReviewSaveTitle: "Save scan edits?",
    confirmReviewSaveDesc: "The current review data will be updated before saving to contacts.",
    confirmSaveContactTitle: "Save to contacts?",
    confirmSaveContactDesc: "The reviewed scan will become an official contact in your address book.",
    confirmDigitalSaveTitle: "Save digital card?",
    confirmDigitalSaveDesc: "Your public digital contact card information will be updated.",
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
];

const CONTEXT_FIELDS = ["event_name", "location", "source", "tags", "notes"];

function readPendingOtpEmails() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(PENDING_OTP_EMAILS_KEY) || "[]");
    const legacyEmail = sessionStorage.getItem(PENDING_OTP_EMAIL_KEY) || "";
    return dedupeEmails([...(Array.isArray(parsed) ? parsed : []), legacyEmail]);
  } catch {
    return dedupeEmails([sessionStorage.getItem(PENDING_OTP_EMAIL_KEY) || ""]);
  }
}

function dedupeEmails(emails) {
  return [...new Set(emails.map((email) => String(email || "").trim()).filter(Boolean))];
}

function App() {
  const [currentPath, setCurrentPath] = useState(() => normalizePath(window.location.pathname));
  const publicSlug = currentPath.match(/^\/card\/([^/]+)/)?.[1] || "";
  const publicContactId = currentPath.match(/^\/contact\/([^/]+)/)?.[1] || "";
  const publicBundleId = currentPath.match(/^\/bundle\/([^/]+)/)?.[1] || "";
  const isLoginPath = currentPath === "/login";
  const isRegisterPath = currentPath === "/register";
  const isOtpPath = currentPath === "/verify-otp";
  const isAuthPath = isLoginPath || isRegisterPath || isOtpPath;
  const [accessToken, setAccessToken] = useState(localStorage.getItem(ACCESS_TOKEN_KEY) || "");
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem(REFRESH_TOKEN_KEY) || "");
  const [user, setUser] = useState(null);
  const [pendingEmails, setPendingEmails] = useState(readPendingOtpEmails);
  const [pendingEmail, setPendingEmail] = useState(() => readPendingOtpEmails()[0] || "");
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
  const [avatarHistory, setAvatarHistory] = useState([]);
  const [publicCard, setPublicCard] = useState(null);
  const [publicContact, setPublicContact] = useState(null);
  const [publicBundle, setPublicBundle] = useState(null);
  const [contactBundle, setContactBundle] = useState(null);
  const [contactBundles, setContactBundles] = useState([]);
  const [selectedBundleContactIds, setSelectedBundleContactIds] = useState([]);
  const [contactQuery, setContactQuery] = useState("");
  const [scanQuery, setScanQuery] = useState("");
  const [uploadFiles, setUploadFiles] = useState({ file: null, file2: null });
  const [qrContactFile, setQrContactFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [showWelcomePanel, setShowWelcomePanel] = useState(false);
  const [instructionView, setInstructionView] = useState(null);

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
    const emails = dedupeEmails(pendingEmails);
    if (emails.length) {
      sessionStorage.setItem(PENDING_OTP_EMAILS_KEY, JSON.stringify(emails));
      sessionStorage.setItem(PENDING_OTP_EMAIL_KEY, pendingEmail || emails[0]);
    } else {
      sessionStorage.removeItem(PENDING_OTP_EMAILS_KEY);
      sessionStorage.removeItem(PENDING_OTP_EMAIL_KEY);
    }
  }, [pendingEmail, pendingEmails]);

  useEffect(() => {
    if (pendingEmails.length > 0 && !pendingEmails.includes(pendingEmail)) {
      setPendingEmail(pendingEmails[0]);
    }
  }, [pendingEmail, pendingEmails]);

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
    if (accessToken && (currentPath === "/" || isAuthPath)) {
      navigateTo("/contacts", setCurrentPath);
    }
  }, [accessToken, currentPath, isAuthPath]);

  useEffect(() => {
    if (!accessToken && isOtpPath && !pendingEmail) {
      navigateTo("/register", setCurrentPath);
    }
  }, [accessToken, isOtpPath, pendingEmail]);

  async function loadPublicCard(slug = publicSlug) {
    if (!slug) return null;
    return fetch(`${API_BASE.replace(/\/$/, "")}/documents/digital-cards/${encodeURIComponent(slug)}/public`)
      .then((response) => response.json())
      .then((payload) => {
        setPublicCard(payload);
        return payload;
      })
      .catch(() => {
        const payload = { error: language === "vi" ? "Không tìm thấy thẻ liên hệ." : "Digital card not found." };
        setPublicCard(payload);
        return payload;
      });
  }

  async function loadPublicContact(contactId = publicContactId) {
    if (!contactId) return null;
    return fetch(`${API_BASE.replace(/\/$/, "")}/documents/contacts/${encodeURIComponent(contactId)}/public`)
      .then((response) => response.json())
      .then((payload) => {
        setPublicContact(payload);
        return payload;
      })
      .catch(() => {
        const payload = { error: language === "vi" ? "Không tìm thấy liên hệ." : "Contact not found." };
        setPublicContact(payload);
        return payload;
      });
  }

  async function loadPublicBundle(bundleId = publicBundleId) {
    if (!bundleId) return null;
    return fetch(`${API_BASE.replace(/\/$/, "")}/documents/contact-bundles/${encodeURIComponent(bundleId)}/public`)
      .then((response) => response.json())
      .then((payload) => {
        setPublicBundle(payload);
        return payload;
      })
      .catch(() => {
        const payload = { error: language === "vi" ? "Không tìm thấy gói liên hệ." : "Contact bundle not found." };
        setPublicBundle(payload);
        return payload;
      });
  }

  useEffect(() => {
    if (!publicSlug) return;
    loadPublicCard(publicSlug);
  }, [publicSlug, language]);

  useEffect(() => {
    if (!publicContactId) return;
    loadPublicContact(publicContactId);
  }, [publicContactId, language]);

  useEffect(() => {
    if (!publicBundleId) return;
    loadPublicBundle(publicBundleId);
  }, [publicBundleId, language]);

  useEffect(() => {
    if (!accessToken) return;

    async function bootstrapSession() {
      const profile = await loadMe();
      if (profile) {
        await loadDocuments();
        await loadContacts();
        await loadDigitalCard();
        await loadAvatarHistory();
        await loadContactBundles();
      }
    }

    bootstrapSession();
  }, []);

  function notify(message, type = "success") {
    setToast({ message, type });
    window.clearTimeout(notify.timer);
    notify.timer = window.setTimeout(() => setToast(null), 3600);
  }

  function askConfirm(options) {
    return new Promise((resolve) => {
      setConfirmDialog({
        tone: options.tone || "primary",
        title: options.title || t("confirmTitle"),
        message: options.message || "",
        confirmLabel: options.confirmLabel || t("confirmSave"),
        cancelLabel: options.cancelLabel || t("confirmCancel"),
        onCancel: () => {
          setConfirmDialog(null);
          resolve(false);
        },
        onConfirm: () => {
          setConfirmDialog(null);
          resolve(true);
        },
      });
    });
  }

  function saveTokens(tokens) {
    setAccessToken(tokens.access_token);
    setRefreshToken(tokens.refresh_token);
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
  }

  function welcomeDismissedKey(profile = user) {
    const userKey = profile?.id || profile?.email || "anonymous";
    return `${WELCOME_DISMISSED_PREFIX}.${userKey}`;
  }

  function shouldShowWelcome(profile) {
    return localStorage.getItem(welcomeDismissedKey(profile)) !== "1";
  }

  function dismissWelcome({ doNotShowAgain = false } = {}) {
    if (doNotShowAgain) {
      localStorage.setItem(welcomeDismissedKey(), "1");
    }
    setShowWelcomePanel(false);
  }

  function clearSession() {
    setAccessToken("");
    setRefreshToken("");
    setUser(null);
    setDocuments([]);
    setContacts([]);
    setSelectedId("");
    setSelectedContactId("");
    setPendingEmails([]);
    setPendingEmail("");
    setPreviewUrls([]);
    setReview(null);
    setReviewDraft({});
    setContextDraft({});
    setDigitalCard(null);
    setShowWelcomePanel(false);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(PENDING_OTP_EMAILS_KEY);
    sessionStorage.removeItem(PENDING_OTP_EMAIL_KEY);
  }

  function addPendingOtpEmail(email) {
    const cleanEmail = String(email || "").trim();
    if (!cleanEmail) return;
    setPendingEmails((current) => dedupeEmails([cleanEmail, ...current]));
    setPendingEmail(cleanEmail);
  }

  function removePendingOtpEmail(email) {
    const cleanEmail = String(email || "").trim();
    const nextEmails = pendingEmails.filter((item) => item !== cleanEmail);
    setPendingEmails(nextEmails);
    setPendingEmail((selected) => selected === cleanEmail ? nextEmails[0] || "" : selected);
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

  function uploadWithProgress(path, body, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_BASE.replace(/\/$/, "")}${path}`);
      if (accessToken) xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        onProgress(Math.min(98, Math.round((event.loaded / event.total) * 100)));
      };
      xhr.onload = () => {
        const contentType = xhr.getResponseHeader("content-type") || "";
        const payload = contentType.includes("application/json")
          ? JSON.parse(xhr.responseText || "{}")
          : xhr.responseText;

        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress(100);
          resolve(payload);
          return;
        }

        const detail = payload?.error?.message || payload?.detail || payload?.message || xhr.statusText;
        const error = new Error(Array.isArray(detail) ? detail.join(", ") : detail);
        error.status = xhr.status;
        error.code = payload?.error?.code;
        reject(error);
      };
      xhr.onerror = () => reject(new Error("Upload failed"));
      xhr.send(body);
    });
  }

  async function runTask(name, task) {
    setBusy(name);
    try {
      return await task();
    } catch (error) {
      if (error.status === 401 || error.code === "USER_NOT_ACTIVE") {
        clearSession();
        navigateTo("/login", setCurrentPath);
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

  async function updateProfile(form) {
    return runTask("profile-update", async () => {
      const payload = await request("/auth/me", {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      setUser(payload);
      await loadAvatarHistory();
      notify(t("profileUpdated"));
      return payload;
    });
  }

  async function uploadAvatarImage(file) {
    if (!file) return null;

    return runTask("avatar-upload", async () => {
      const body = new FormData();
      body.append("file", file);
      const payload = await uploadWithProgress("/auth/me/avatar", body, setUploadProgress);
      setUser(payload);
      await loadAvatarHistory();
      notify(t("profileUpdated"));
      return payload;
    });
  }

  async function deleteAvatarImage(avatarId) {
    const confirmed = await askConfirm({
      tone: "danger",
      title: t("confirmDeleteAvatarTitle"),
      message: t("confirmDeleteAvatarDesc"),
      confirmLabel: t("confirmDelete"),
    });
    if (!confirmed) return null;

    return runTask("avatar-delete", async () => {
      const payload = await request(`/auth/me/avatars/${encodeURIComponent(avatarId)}`, {
        method: "DELETE",
      });
      setUser(payload);
      await loadAvatarHistory();
      notify(t("avatarDeleted"));
      return payload;
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
      const profile = await loadMe(tokens.access_token);
      await loadDocuments(tokens.access_token);
      await loadContacts(tokens.access_token);
      await loadDigitalCard(tokens.access_token);
      await loadAvatarHistory(tokens.access_token);
      await loadContactBundles(tokens.access_token);
      setShowWelcomePanel(shouldShowWelcome(profile));
      navigateTo("/contacts", setCurrentPath);
    });
  }

  async function register(form) {
    return runTask("register", async () => {
      const payload = await request("/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });
      addPendingOtpEmail(form.email);
      navigateTo("/verify-otp", setCurrentPath);
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
      removePendingOtpEmail(form.email);
      navigateTo("/login", setCurrentPath);
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
    setAvatarHistory([]);
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

  async function loadAvatarHistory(tokenOverride) {
    return runTask("avatar-history", async () => {
      const payload = await request("/auth/me/avatars", { tokenOverride });
      setAvatarHistory(payload.avatars || []);
      return payload.avatars || [];
    });
  }

  async function loadContactBundles(tokenOverride) {
    return runTask("contact-bundles", async () => {
      const payload = await request("/documents/contact-bundles", { tokenOverride });
      setContactBundles(payload.items || []);
      setContactBundle((current) => current || payload.items?.[0] || null);
      return payload.items || [];
    });
  }

  async function createManualContact(form) {
    const confirmed = await askConfirm({
      tone: "primary",
      title: t("confirmCreateContactTitle"),
      message: t("confirmCreateContactDesc"),
      confirmLabel: t("confirmSave"),
    });
    if (!confirmed) return null;

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

  async function createContactFromQr() {
    if (!qrContactFile) {
      notify(t("qrContactRequired"), "error");
      return null;
    }

    return runTask("qr-contact", async () => {
      setUploadProgress(0);
      const body = new FormData();
      body.append("file", qrContactFile);
      const payload = await uploadWithProgress("/documents/contacts/from-digital-qr", body, setUploadProgress);
      const imported = Array.isArray(payload.items) ? payload.items : [payload].filter(Boolean);
      setContacts((current) => [
        ...imported,
        ...current.filter((contact) => !imported.some((item) => item.id === contact.id)),
      ]);
      setQrContactFile(null);
      notify(imported.length > 1 ? t("qrBundleSaved", { count: imported.length }) : t("qrContactSaved"));
      if (imported.length === 1) {
        setSelectedContactId(imported[0].id);
        navigateView("contact-detail", imported[0].id);
      } else {
        navigateView("contacts");
      }
    });
  }

  async function createContactBundle(contactIds) {
    if (!contactIds.length) return null;
    return runTask("contact-bundle", async () => {
      const payload = await request("/documents/contact-bundles", {
        method: "POST",
        body: JSON.stringify({ contact_ids: contactIds }),
      });
      setContactBundle(payload);
      setContactBundles((current) => [payload, ...current.filter((bundle) => bundle.id !== payload.id)]);
      notify(t("bundleCreated"));
      return payload;
    });
  }

  async function deleteContactBundle(bundleId) {
    return runTask("contact-bundle-delete", async () => {
      await request(`/documents/contact-bundles/${encodeURIComponent(bundleId)}`, { method: "DELETE" });
      setContactBundles((current) => {
        const next = current.filter((bundle) => bundle.id !== bundleId);
        setContactBundle((selected) => selected?.id === bundleId ? next[0] || null : selected);
        return next;
      });
    });
  }

  async function updateContact(contactId, form) {
    const confirmed = await askConfirm({
      tone: "primary",
      title: t("confirmUpdateContactTitle"),
      message: t("confirmUpdateContactDesc"),
      confirmLabel: t("confirmUpdate"),
    });
    if (!confirmed) return null;

    return runTask("contact-update", async () => {
      const payload = await request(`/documents/contacts/${encodeURIComponent(contactId)}`, {
        method: "PATCH",
        body: JSON.stringify(normalizeContactPayload(form)),
      });
      setContacts((current) => current.map((contact) => contact.id === contactId ? payload : contact));
      notify(t("contactUpdated"));
      return payload;
    });
  }

  async function uploadDocument() {
    if (!uploadFiles.file) {
      notify(t("frontImageRequired"), "error");
      return;
    }

    return runTask("upload", async () => {
      try {
        setUploadProgress(4);
        const body = new FormData();
        body.append("file", uploadFiles.file);
        if (uploadFiles.file2) body.append("file2", uploadFiles.file2);
        const payload = await uploadWithProgress("/documents", body, setUploadProgress);
        notify(t("uploadDone", { id: payload.processing_id }));
        setUploadFiles({ file: null, file2: null });
        await loadDocuments();
        await selectDocument(payload.processing_id);
        navigateTo("/ocr", setCurrentPath);
        window.setTimeout(() => setUploadProgress(0), 700);
      } catch (error) {
        setUploadProgress(0);
        throw error;
      }
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
    const confirmed = await askConfirm({
      tone: "primary",
      title: t("confirmReviewSaveTitle"),
      message: t("confirmReviewSaveDesc"),
      confirmLabel: t("confirmSave"),
    });
    if (!confirmed) return null;

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
    const confirmed = await askConfirm({
      tone: "primary",
      title: t("confirmSaveContactTitle"),
      message: t("confirmSaveContactDesc"),
      confirmLabel: t("confirmSave"),
    });
    if (!confirmed) return null;

    return runTask("confirm", async () => {
      const reviewPayload = await request(`/documents/${encodeURIComponent(selectedId)}/review`, {
        method: "PATCH",
        body: JSON.stringify({
          updates: normalizeContactPayload(reviewDraft),
          context: normalizeContextPayload(contextDraft),
        }),
      });
      setReview(reviewPayload);
      setReviewDraft(reviewPayload.structured_data || {});
      setContextDraft(reviewPayload.context_data || {});
      const payload = await request(`/documents/${encodeURIComponent(selectedId)}/confirm`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      notify(t("contactSaved"));
      setSelectedId("");
      setPreviewUrls([]);
      setReview(null);
      setReviewDraft({});
      setContextDraft({});
      await loadContacts();
      await loadDocuments();
      navigateTo("/contacts", setCurrentPath);
    });
  }

  async function deleteDocument(processingId = selectedId) {
    if (!processingId) return;
    const confirmed = await askConfirm({
      tone: "danger",
      title: t("confirmDeleteScanTitle"),
      message: t("confirmDeleteScanDesc"),
      confirmLabel: t("confirmDelete"),
    });
    if (!confirmed) return null;

    return runTask("delete", async () => {
      await request(`/documents/${encodeURIComponent(processingId)}`, { method: "DELETE" });
      setDocuments((current) => current.filter((item) => item.processing_id !== processingId));
      if (selectedId === processingId) {
        setSelectedId("");
        setPreviewUrls([]);
        setReview(null);
        setReviewDraft({});
        setContextDraft({});
      }
      notify(t("scanDeleted"));
    });
  }

  async function clearQueue() {
    const confirmed = await askConfirm({
      tone: "danger",
      title: t("confirmClearQueueTitle"),
      message: t("confirmClearQueueDesc"),
      confirmLabel: t("confirmDelete"),
    });
    if (!confirmed) return null;

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
    const confirmed = await askConfirm({
      tone: "danger",
      title: t("confirmDeleteContactTitle"),
      message: t("confirmDeleteContactDesc"),
      confirmLabel: t("confirmDelete"),
    });
    if (!confirmed) return null;

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
    await loadAvatarHistory();
    await loadContactBundles();
  }

  async function saveDigitalCard(form) {
    const confirmed = await askConfirm({
      tone: "primary",
      title: t("confirmDigitalSaveTitle"),
      message: t("confirmDigitalSaveDesc"),
      confirmLabel: t("confirmSave"),
    });
    if (!confirmed) return null;

    return runTask("digital-save", async () => {
      const payload = await request("/documents/digital-card", {
        method: "PUT",
        body: JSON.stringify(normalizeDigitalCardPayload({
          ...form,
          slug: emailSlug(user?.email || form.email || form.slug),
          photo_url: user?.avatar_url || form.photo_url,
        })),
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

  if (publicContactId) {
    return <PublicContactPage contact={publicContact} language={language} />;
  }

  if (publicBundleId) {
    return <PublicBundlePage bundle={publicBundle} language={language} />;
  }

  if (!accessToken && isOtpPath && !pendingEmail) {
    return null;
  }

  if (!accessToken && !isAuthPath) {
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
        authView={isRegisterPath ? "register" : isOtpPath ? "otp" : "login"}
        busy={busy}
        pendingEmails={pendingEmails}
        pendingEmail={pendingEmail}
        setPendingEmail={setPendingEmail}
        onNavigate={(path) => navigateTo(path, setCurrentPath)}
        onLogin={login}
        onRegister={register}
        onVerifyOtp={verifyOtp}
        onResendOtp={resendOtp}
        toast={toast}
      />
    );
  }

  return (
    <div className="grid min-h-screen grid-cols-[280px_minmax(0,1fr)] bg-[radial-gradient(circle_at_90%_0%,rgba(15,23,42,0.12),transparent_30%),linear-gradient(135deg,#f8fafc,#eef2f7_48%,#ffffff)] text-slate-950 max-[900px]:grid-cols-1">
      <Sidebar
        t={t}
        activeView={activeView}
        user={user}
        onNavigate={navigateView}
        onLogout={logout}
      />
      <main className="min-w-0 px-7 py-6 max-[900px]:px-4">
        <div className="mx-auto grid max-w-[1500px] gap-6">
        <Topbar
          t={t}
          language={language}
          onLanguageChange={setLanguage}
          activeView={activeView}
          busy={busy}
          user={user}
          onRefresh={refreshWorkspace}
          onShowInstructions={() => setInstructionView(activeView)}
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
            selectedIds={selectedBundleContactIds}
            onSelectedIdsChange={setSelectedBundleContactIds}
            bundle={contactBundle}
            bundles={contactBundles}
            busy={busy}
            onCreateBundle={createContactBundle}
            onSelectBundle={setContactBundle}
            onDeleteBundle={deleteContactBundle}
            onOpenBundle={(bundleId) => navigateTo(`/bundle/${encodeURIComponent(bundleId)}`, setCurrentPath)}
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
        {activeView === "qr-contact" && (
          <QrContactView
            t={t}
            busy={busy}
            file={qrContactFile}
            onFileChange={setQrContactFile}
            uploadProgress={uploadProgress}
            onBack={() => navigateView("contacts")}
            onUpload={createContactFromQr}
          />
        )}
        {activeView === "contact-detail" && (
          <ContactDetailView
            t={t}
            contact={selectedContact}
            onBack={() => navigateView("contacts")}
            onOpenOcr={() => navigateView("ocr")}
            onRemove={deleteContact}
            onUpdate={updateContact}
            busy={busy}
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
            uploadProgress={uploadProgress}
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
            onProfileSave={updateProfile}
            onAvatarUpload={uploadAvatarImage}
            onAvatarDelete={deleteAvatarImage}
            avatarHistory={avatarHistory}
            uploadProgress={uploadProgress}
          />
        )}
        </div>
      </main>
      {showWelcomePanel && (
        <WelcomePanel
          t={t}
          user={user}
          onClose={() => dismissWelcome()}
          onDoNotShowAgain={() => dismissWelcome({ doNotShowAgain: true })}
        />
      )}
      {instructionView && (
        <InstructionDialog
          t={t}
          language={language}
          view={instructionView}
          onClose={() => setInstructionView(null)}
        />
      )}
      {confirmDialog && <ConfirmDialog {...confirmDialog} />}
      {toast && <Toast toast={toast} />}
    </div>
  );
}

function BrandLogo({ className = "size-12 rounded-2xl" }) {
  return (
    <span className={`${className} grid shrink-0 place-items-center overflow-hidden border border-slate-200 bg-white shadow-sm`}>
      <img className="size-full object-cover" src={BRAND_LOGO_URL} alt="Cardly logo" />
    </span>
  );
}

function WelcomePanel({ t, user, onClose, onDoNotShowAgain }) {
  const displayName = user?.full_name || user?.email?.split("@")[0] || "Cardly user";
  const features = [
    [ContactRound, t("welcomeFeatureContacts"), t("welcomeFeatureContactsDesc"), "from-sky-50 to-white text-sky-700 ring-sky-100"],
    [FileText, t("welcomeFeatureOcr"), t("welcomeFeatureOcrDesc"), "from-emerald-50 to-white text-emerald-700 ring-emerald-100"],
    [QrCode, t("welcomeFeatureQr"), t("welcomeFeatureQrDesc"), "from-amber-50 to-white text-amber-700 ring-amber-100"],
    [Globe2, t("welcomeFeatureDigital"), t("welcomeFeatureDigitalDesc"), "from-fuchsia-50 to-white text-fuchsia-700 ring-fuchsia-100"],
  ];

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/60 p-4 backdrop-blur-md">
      <section className="max-h-[calc(100vh-2rem)] w-full max-w-5xl overflow-y-auto overflow-x-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_34px_120px_rgba(2,6,23,0.34)]">
        <div className="grid min-h-[460px] bg-[linear-gradient(135deg,#f8fbff,#ffffff_34%,#f6f2ff_68%,#fff7ed)] p-6 max-[760px]:min-h-[380px] max-[760px]:p-5">
          <div className="grid content-between gap-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="inline-flex min-h-8 items-center rounded-full bg-white/82 px-3 text-xs font-black uppercase tracking-normal text-slate-500 shadow-sm ring-1 ring-slate-200">{t("welcomeKicker")}</p>
                <h3 className="mt-4 max-w-3xl text-6xl font-black leading-none tracking-normal text-slate-950 max-[900px]:text-5xl max-[760px]:text-4xl">
                  {t("welcomeTitle", { name: displayName })}
                </h3>
              </div>
              <Badge tone="success">{user?.is_active ? t("verified") : t("session")}</Badge>
            </div>
            <p className="max-w-3xl text-lg font-semibold leading-8 text-slate-600 max-[760px]:text-base">{t("welcomeDesc")}</p>
            <div className="flex flex-wrap gap-2">
              <Badge tone="neutral">{t("navContacts")}</Badge>
              <Badge tone="neutral">{t("navOcr")}</Badge>
              <Badge tone="neutral">{t("navQrContact")}</Badge>
              <Badge tone="neutral">{t("navDigital")}</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 border-y border-slate-200 bg-slate-50/80 p-4 max-[900px]:grid-cols-2 max-[640px]:grid-cols-1 max-[760px]:p-4">
          {features.map(([Icon, title, desc, tone]) => (
            <article key={title} className={`grid min-h-32 content-start gap-3 rounded-2xl border border-white bg-gradient-to-br ${tone} p-4 shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/10`}>
              <div className="flex items-center justify-between gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-white shadow-sm">
                  <Icon size={18} />
                </span>
              </div>
              <div>
                <strong className="text-base text-slate-950">{title}</strong>
                <p className="mt-1.5 text-xs leading-6 text-slate-500">{desc}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 p-4 max-[760px]:p-4">
          <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
            <span className="grid size-10 place-items-center rounded-2xl bg-slate-100 text-slate-700">
              <Sparkles size={18} />
            </span>
            <span>{t("welcomeFooter")}</span>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onPress={onDoNotShowAgain}>{t("welcomeDoNotShow")}</Button>
            <Button variant="primary" onPress={onClose} startContent={<Sparkles size={17} />}>{t("welcomeStart")}</Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function InstructionDialog({ t, language, view, onClose }) {
  const content = pageInstructions(view, language);
  if (!content) return null;
  const Icon = content.icon;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-5 backdrop-blur-sm" role="presentation" onMouseDown={onClose}>
      <section
        className="w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_34px_120px_rgba(2,6,23,0.28)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="instruction-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={`grid gap-4 bg-gradient-to-br ${content.tone} p-6`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid size-13 shrink-0 place-items-center rounded-2xl bg-white text-slate-950 shadow-sm">
                <Icon size={22} />
              </span>
              <div>
                <Badge tone="neutral">{language === "vi" ? "Instruction" : "Instruction"}</Badge>
                <h3 id="instruction-dialog-title" className="mt-2 text-3xl font-black leading-tight tracking-normal text-slate-950">
                  {content.title}
                </h3>
              </div>
            </div>
            <Button variant="outline" onPress={onClose}>{language === "vi" ? "Đóng" : "Close"}</Button>
          </div>
          <p className="max-w-2xl text-sm font-semibold leading-7 text-slate-600">{content.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 bg-white p-5 max-[760px]:grid-cols-1">
          {content.items.map(([ItemIcon, title, text]) => (
            <article key={title} className="grid min-h-32 content-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <span className="grid size-10 place-items-center rounded-xl bg-white text-slate-950 shadow-sm">
                <ItemIcon size={18} />
              </span>
              <div>
                <strong className="text-base text-slate-950">{title}</strong>
                <p className="mt-1.5 text-sm leading-6 text-slate-500">{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function ConfirmDialog({ tone = "primary", title, message, confirmLabel, cancelLabel, onCancel, onConfirm }) {
  const isDanger = tone === "danger";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-5 backdrop-blur-sm" role="presentation" onMouseDown={onCancel}>
      <section
        className="w-full max-w-md overflow-hidden rounded-[2rem] border border-white/70 bg-white p-5 shadow-[0_34px_120px_rgba(2,6,23,0.28)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${isDanger ? "bg-red-50 text-red-600" : "bg-slate-950 text-white"}`}>
            {isDanger ? <Trash2 size={21} /> : <ShieldCheck size={21} />}
          </span>
          <div className="min-w-0">
            <h3 id="confirm-dialog-title" className="m-0 text-2xl font-black leading-tight tracking-normal text-slate-950">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onPress={onCancel}>{cancelLabel}</Button>
          <Button variant={isDanger ? "danger" : "primary"} onPress={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}

function AuthLayout(props) {
  return (
    <main className="grid min-h-screen grid-cols-[minmax(0,1fr)_minmax(390px,460px)] bg-[linear-gradient(90deg,rgba(248,250,252,0.96),rgba(248,250,252,0.72)),url('https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center max-[900px]:grid-cols-1">
      <section className="flex min-h-screen flex-col justify-between p-10 max-[900px]:min-h-0 max-[900px]:gap-12">
        <button
          type="button"
          className="flex w-fit items-center gap-3 rounded-2xl text-left transition hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-4"
          onClick={() => props.onNavigate("/")}
          aria-label={props.language === "vi" ? "Về trang giới thiệu Cardly" : "Back to Cardly landing page"}
        >
          <BrandLogo />
          <div>
            <h1 className="text-2xl font-black tracking-normal text-slate-950">Cardly</h1>
            <p className="text-sm font-semibold text-slate-500">Personal contact OS</p>
          </div>
        </button>
        <div className="max-w-3xl">
          <Badge tone="success">{props.language === "vi" ? "Danh thiếp + Danh bạ" : "Cards + Contacts"}</Badge>
          <h2 className="mt-5 max-w-3xl text-6xl font-black leading-none tracking-normal text-slate-950 max-[900px]:text-4xl">{props.language === "vi" ? "Scan danh thiếp, kiểm tra dữ liệu, lưu vào danh bạ." : "Scan cards, review data, save clean contacts."}</h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">{props.language === "vi" ? "Một workspace gọn cho xác thực tài khoản, quét danh thiếp và quản lý liên hệ cá nhân." : "A focused workspace for account access, card scanning and personal contact management."}</p>
        </div>
        <div className="grid grid-cols-3 gap-3 max-[640px]:grid-cols-1">
          <Stat label={props.language === "vi" ? "Danh bạ" : "Contacts"} value={props.language === "vi" ? "Gọn gàng" : "Organized" } />
          <Stat label={props.language === "vi" ? "Review" : "Review"} value={props.language === "vi" ? "Rõ ràng" : "Clear" } />
          <Stat label={props.language === "vi" ? "Chia sẻ" : "Sharing"} value={props.language === "vi" ? "Nhanh" : "Fast" } />
        </div>
      </section>

      <section className="grid place-items-center gap-3 border-l border-white/70 bg-white/70 p-7 backdrop-blur-xl max-[900px]:border-l-0 max-[900px]:border-t">
        <Card className="w-full max-w-md">
          <Card.Header>
            <Card.Title>{authTitle(props.authView, props.t)}</Card.Title>
            <Card.Description>{authDescription(props.authView, props.language)}</Card.Description>
          </Card.Header>
          <Card.Content>
            {props.authView !== "otp" && (
              <Tabs
                value={props.authView}
                onValueChange={(view) => props.onNavigate(view === "register" ? "/register" : "/login")}
                items={[
                  { key: "login", label: props.t("login") },
                  { key: "register", label: props.t("register") },
                ]}
              />
            )}
            {props.authView === "login" && <LoginForm t={props.t} busy={props.busy} onSubmit={props.onLogin} />}
            {props.authView === "register" && <RegisterForm t={props.t} busy={props.busy} onSubmit={props.onRegister} />}
            {props.authView !== "otp" && props.pendingEmails.length > 0 && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="mb-3 text-sm font-semibold leading-6 text-slate-600">
                  {props.language === "vi"
                    ? "Bạn còn tài khoản đang chờ xác thực OTP."
                    : "You still have accounts waiting for OTP verification."}
                </p>
                <div className="mb-3 grid gap-2">
                  {props.pendingEmails.map((email) => (
                    <button
                      key={email}
                      type="button"
                      className={`flex min-h-10 items-center justify-between gap-3 rounded-xl border px-3 text-left text-sm font-bold transition ${props.pendingEmail === email ? "border-slate-950 bg-white text-slate-950 shadow-sm" : "border-slate-200 bg-white/70 text-slate-500 hover:text-slate-950"}`}
                      onClick={() => props.setPendingEmail(email)}
                    >
                      <span className="truncate">{email}</span>
                      {props.pendingEmail === email && <Check size={16} />}
                    </button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  full
                  type="button"
                  isDisabled={!props.pendingEmail}
                  startContent={<BadgeCheck size={17} />}
                  onPress={() => props.onNavigate("/verify-otp")}
                >
                  {props.language === "vi" ? "Tiếp tục xác thực OTP" : "Continue OTP verification"}
                </Button>
              </div>
            )}
            {props.authView === "otp" && (
              <OtpForm
                t={props.t}
                busy={props.busy}
                emails={props.pendingEmails}
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
        ["Quét danh thiếp", "Upload ảnh danh thiếp, theo dõi tiến trình xử lý, xem preview và kiểm tra dữ liệu trước khi lưu."],
        ["Review trước khi lưu", "Chỉnh lại tên, công ty, chức danh, email, số điện thoại và ngữ cảnh ngay trong màn hình kết quả quét."],
        ["Danh bạ tập trung", "Tìm kiếm, xem chi tiết, chỉnh sửa, xóa liên hệ và xem lại ảnh danh thiếp hoặc QR gốc khi cần."],
        ["Thêm bằng QR", "Quét QR từ thẻ số, QR contact hoặc QR bundle để lưu nhanh một hoặc nhiều liên hệ vào danh bạ."],
        ["QR bundle", "Chọn nhiều liên hệ, tạo một mã QR chung, tải QR về và mở trang bundle để xem danh sách được chia sẻ."],
        ["Thẻ liên hệ số", "Tạo hồ sơ công khai có avatar, vị trí, công ty, bio, kênh liên hệ, QR tải xuống và trang /card riêng."],
      ]
    : [
        ["Business-card scanning", "Upload card images, track processing progress, preview the image and review extracted data before saving."],
        ["Review before saving", "Edit name, company, position, email, phone and meeting context directly from the scan result screen."],
        ["Centralized contacts", "Search, inspect, edit and delete contacts, with business-card images or source QR kept available when useful."],
        ["Add by QR", "Scan a QR from a digital card, shared contact or bundle to save one or many contacts quickly."],
        ["QR bundles", "Select multiple contacts, create one shared QR, download it and open a bundle page with the shared list."],
        ["Digital contact card", "Create a public profile with avatar, position, company, bio, contact channels, downloadable QR and a /card page."],
      ];

  return (
    <main className="min-h-screen bg-[linear-gradient(90deg,rgba(248,250,252,0.98),rgba(248,250,252,0.88)),url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-fixed bg-center">
      <header className="flex items-center justify-between gap-5 px-10 py-6 max-[760px]:px-5">
        <div className="flex items-center gap-3">
          <BrandLogo />
          <div>
            <h1 className="text-2xl font-black tracking-normal text-slate-950">Cardly</h1>
            <p className="text-sm font-semibold text-slate-500">Smart contact forge</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher language={language} onChange={onLanguageChange} />
          <Button variant="outline" onPress={onStart} startContent={<ShieldCheck size={17} />}>{t("login")}</Button>
        </div>
      </header>

      <section className="mx-auto grid w-[min(1180px,calc(100vw-48px))] grid-cols-[minmax(0,1fr)_minmax(340px,440px)] items-center gap-12 py-12 max-[900px]:grid-cols-1">
        <div>
          <Badge tone="neutral">{language === "vi" ? "Quét danh thiếp · QR bundle · Thẻ liên hệ số" : "Card scanning · QR bundles · Digital card"}</Badge>
          <h2 className="mt-5 max-w-3xl text-7xl font-black leading-none tracking-normal text-slate-950 max-[900px]:text-5xl">{language === "vi" ? "Biến danh thiếp thành danh bạ thông minh." : "Turn business cards into a smart address book."}</h2>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            {language === "vi"
              ? "Cardly giúp scan danh thiếp, kiểm tra dữ liệu, lưu liên hệ, chia sẻ từng contact hoặc cả nhóm contact bằng QR và tạo thẻ liên hệ số của riêng bạn."
              : "Cardly scans business cards, lets you review contact data, save clean records, share one or many contacts by QR and create your own digital contact card."}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button variant="primary" onPress={onStart} startContent={<ChevronRight size={17} />}>{language === "vi" ? "Bắt đầu" : "Get started"}</Button>
            <Badge tone="success">{language === "vi" ? "Lưu liên hệ bằng ảnh hoặc QR" : "Save contacts from image or QR"}</Badge>
          </div>
        </div>
        <div className="grid gap-4">
          <div className="grid gap-3 rounded-[2rem] border border-white/70 bg-white/80 p-4 shadow-2xl shadow-slate-900/10 backdrop-blur-xl">
            <div className="relative grid min-h-48 content-end gap-2 overflow-hidden rounded-3xl border border-slate-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(238,241,245,0.92)),url('https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80')] bg-cover bg-center p-5">
              <span className="size-12 rounded-2xl border border-slate-200 bg-white" />
                <strong>{language === "vi" ? "Danh thiếp đã scan" : "Scanned business card"}</strong>
                <small className="text-slate-500">{language === "vi" ? "tên · công ty · số điện thoại · email" : "name · company · phone · email"}</small>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(language === "vi" ? ["Tên", "Công ty", "Liên hệ", "Ngữ cảnh"] : ["Name", "Company", "Contact", "Context"]).map((item) => <span key={item} className="grid min-h-9 place-items-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600">{item}</span>)}
            </div>
          </div>
          <div className="grid gap-3 rounded-[2rem] border border-white/70 bg-white/80 p-4 shadow-2xl shadow-slate-900/10 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-sm font-bold text-slate-500">
              <span>{language === "vi" ? "Luồng làm việc Cardly" : "Cardly workflow"}</span>
              <Badge tone="success">Ready</Badge>
            </div>
            <div className="flex min-h-16 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
              <CloudUpload size={18} />
              <div>
                <strong>{language === "vi" ? "Upload danh thiếp" : "Upload business card"}</strong>
                <small className="block text-slate-500">{language === "vi" ? "Ảnh được lưu lại để đối chiếu khi cần." : "Images are kept available for review."}</small>
              </div>
            </div>
            <div className="flex min-h-16 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
              <FileText size={18} />
              <div>
                <strong>{language === "vi" ? "Đọc và bóc tách dữ liệu" : "Read and extract fields"}</strong>
                <small className="block text-slate-500">{language === "vi" ? "Tên, công ty, email, số điện thoại, website." : "Name, company, email, phone and website."}</small>
              </div>
            </div>
            <div className="flex min-h-16 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
              <ShieldCheck size={18} />
              <div>
                <strong>{language === "vi" ? "Review và lưu ngữ cảnh" : "Review + context"}</strong>
                <small className="block text-slate-500">{language === "vi" ? "Chỉnh dữ liệu, thêm ghi chú và thông tin buổi gặp." : "Edit fields, notes and meeting details."}</small>
              </div>
            </div>
            <div className="flex min-h-16 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
              <QrCode size={18} />
              <div>
                <strong>{language === "vi" ? "Chia sẻ bằng QR" : "Share by QR"}</strong>
                <small className="block text-slate-500">{language === "vi" ? "Tạo QR cho contact, bundle hoặc thẻ cá nhân." : "Create QR for contacts, bundles or your own card."}</small>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Stat label={language === "vi" ? "Nguồn lưu" : "Save from"} value={language === "vi" ? "Ảnh/QR" : "Image/QR"} />
            <Stat label={language === "vi" ? "Chia sẻ" : "Sharing"} value={language === "vi" ? "1 hoặc nhiều" : "1 or many"} />
            <Stat label={language === "vi" ? "Ngôn ngữ" : "Languages"} value="VI/EN" />
          </div>
        </div>
      </section>

      <section className="mx-auto w-[min(1180px,calc(100vw-48px))] py-14">
        <div className="mb-6 max-w-3xl">
          <Badge tone="neutral">{language === "vi" ? "Tổng quan hệ thống" : "System overview"}</Badge>
          <h3 className="mt-4 text-5xl font-black leading-none tracking-normal text-slate-950 max-[900px]:text-4xl">{language === "vi" ? "Một workspace nhỏ cho toàn bộ vòng đời của danh thiếp." : "One workspace for the full business-card lifecycle."}</h3>
          <p className="mt-4 leading-7 text-slate-600">
            {language === "vi"
              ? "Cardly gom các bước rời rạc thành một luồng rõ ràng: lưu ảnh gốc, nhận diện thông tin, kiểm tra lại, thêm ngữ cảnh gặp gỡ, tạo QR chia sẻ và chuyển thành danh bạ có thể tìm kiếm."
              : "Cardly turns scattered steps into one clear flow: save the original image, extract information, review it, add meeting context, create shareable QR codes and build searchable contacts."}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 max-[900px]:grid-cols-1">
          {landingFeatures.map(([title, text]) => <FeatureCard key={title} title={title} text={text} />)}
        </div>
      </section>

      <section className="mx-auto w-[min(1180px,calc(100vw-48px))] border-y border-slate-200 py-14">
        <div className="mb-6 max-w-3xl">
          <Badge tone="neutral">{language === "vi" ? "Cách hoạt động" : "How it works"}</Badge>
          <h3 className="mt-4 text-5xl font-black leading-none tracking-normal text-slate-950 max-[900px]:text-4xl">{language === "vi" ? "Scan một lần, giữ lại đủ dữ liệu để dùng lâu dài." : "Scan once, keep the data useful for the long run."}</h3>
        </div>
        <div className="grid grid-cols-5 gap-3 max-[900px]:grid-cols-1">
          {[
            [CloudUpload, "Upload", language === "vi" ? "Lưu ảnh gốc" : "Save original image"],
            [FileText, "Extract", language === "vi" ? "Nhận diện thông tin" : "Capture card details"],
            [ShieldCheck, "Review", language === "vi" ? "Chỉnh dữ liệu và ngữ cảnh" : "Edit fields and context"],
            [ContactRound, "Save", language === "vi" ? "Lưu vào danh bạ" : "Create searchable contact"],
            [QrCode, "Share", language === "vi" ? "Tạo QR contact hoặc bundle" : "Create contact or bundle QR"],
          ].map(([Icon, title, text]) => (
            <div key={title} className="grid min-h-36 content-between rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm">
              <Icon size={20} />
              <span className="font-bold">{title}</span>
              <small className="text-slate-500">{text}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto flex w-[min(1180px,calc(100vw-48px))] items-center justify-between gap-6 py-16 max-[760px]:flex-col max-[760px]:items-start">
        <div>
          <h3 className="text-4xl font-black leading-none tracking-normal text-slate-950">{language === "vi" ? "Sẵn sàng xây danh bạ thông minh của riêng bạn." : "Ready to build your own smart address book."}</h3>
          <p className="mt-3 text-slate-600">{language === "vi" ? "Bắt đầu bằng một danh thiếp hoặc một mã QR, sau đó lưu, tìm kiếm và chia sẻ liên hệ theo cách gọn hơn." : "Start with a business card or a QR code, then save, search and share contacts with less friction."}</p>
        </div>
        <Button variant="primary" onPress={onStart} startContent={<ChevronRight size={17} />}>{t("login")}</Button>
      </section>
    </main>
  );
}

function FeatureCard({ title, text }) {
  return (
    <article className="grid min-h-40 content-start gap-3 rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
      <strong className="text-lg text-slate-950">{title}</strong>
      <p className="m-0 leading-7 text-slate-500">{text}</p>
    </article>
  );
}

function LoginForm({ t, busy, onSubmit }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  return (
    <form className="grid gap-3" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}>
      <TextField required icon={<Mail size={17} />} label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
      <TextField
        required
        label={t("password")}
        type={showPassword ? "text" : "password"}
        value={form.password}
        onChange={(password) => setForm({ ...form, password })}
        endContent={<PasswordVisibilityButton isVisible={showPassword} onToggle={() => setShowPassword((visible) => !visible)} />}
      />
      <Button variant="primary" full type="submit" isLoading={busy === "login"} startContent={<ShieldCheck size={18} />}>{t("login")}</Button>
    </form>
  );
}

function RegisterForm({ t, busy, onSubmit }) {
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  return (
    <form className="grid gap-3" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}>
      <TextField required label={t("fullName")} value={form.full_name} onChange={(full_name) => setForm({ ...form, full_name })} />
      <TextField required icon={<Mail size={17} />} label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
      <TextField
        required
        label={t("password")}
        type={showPassword ? "text" : "password"}
        value={form.password}
        onChange={(password) => setForm({ ...form, password })}
        endContent={<PasswordVisibilityButton isVisible={showPassword} onToggle={() => setShowPassword((visible) => !visible)} />}
      />
      <Button variant="primary" full type="submit" isLoading={busy === "register"} startContent={<UserPlus size={18} />}>{t("createAccount")}</Button>
    </form>
  );
}

function OtpForm({ t, busy, emails = [], email, setEmail, onSubmit, onResend }) {
  const [otp, setOtp] = useState("");
  return (
    <form className="grid gap-3" onSubmit={(event) => { event.preventDefault(); onSubmit({ email, otp }); }}>
      {emails.length > 1 && (
        <div className="grid gap-2">
          <span className="text-sm font-semibold text-slate-500">{t("otpEmail")}</span>
          <div className="grid gap-2">
            {emails.map((item) => (
              <button
                key={item}
                type="button"
                className={`flex min-h-10 items-center justify-between gap-3 rounded-xl border px-3 text-left text-sm font-bold transition ${email === item ? "border-slate-950 bg-slate-950 text-white shadow-sm" : "border-slate-200 bg-white/80 text-slate-500 hover:text-slate-950"}`}
                onClick={() => setEmail(item)}
              >
                <span className="truncate">{item}</span>
                {email === item && <Check size={16} />}
              </button>
            ))}
          </div>
        </div>
      )}
      {emails.length <= 1 && (
        <TextField required readOnly icon={<Mail size={17} />} label={t("otpEmail")} type="email" value={email} />
      )}
      <TextField required icon={<BadgeCheck size={17} />} label={t("otpCode")} value={otp} onChange={setOtp} maxLength={6} />
      <Button variant="primary" full type="submit" isLoading={busy === "otp"} startContent={<BadgeCheck size={18} />}>{t("verifyAccount")}</Button>
      <Button variant="ghost" full type="button" isDisabled={!email || busy === "resend"} onPress={() => onResend(email)}>{t("resendOtp")}</Button>
    </form>
  );
}

function Sidebar({ t, activeView, user, onNavigate, onLogout }) {
  const sidebarView = activeView === "contact-detail" ? "contacts" : activeView;

  return (
    <aside className="sticky top-0 h-screen self-start p-5 max-[900px]:static max-[900px]:h-auto">
      <div className="flex h-full flex-col overflow-y-auto rounded-[2rem] border border-white/10 bg-slate-950 p-5 text-white shadow-[0_28px_90px_rgba(2,6,23,0.25)] max-[900px]:h-auto">
      <div className="mb-6 flex items-center gap-3">
        <BrandLogo className="size-12 rounded-2xl" />
        <div>
          <h1 className="text-xl font-black tracking-normal">Cardly</h1>
          <p className="text-sm font-medium text-white/55">Contacts OS</p>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-[44px_minmax(0,1fr)] items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.07] p-3">
        <Avatar value={user?.full_name || user?.email} src={user?.avatar_url} />
        <div className="min-w-0">
          <strong className="block truncate text-sm font-bold">{user?.full_name || "Cardly user"}</strong>
          <p className="truncate text-xs font-medium text-white/50">{user?.email || t("session")}</p>
        </div>
      </div>

      <nav className="grid gap-2">
        {views.map((view) => {
          const Icon = view.icon;
          return (
            <button
              key={view.key}
              type="button"
              className={`flex min-h-12 items-center gap-3 rounded-2xl px-3 text-left text-sm font-bold transition ${sidebarView === view.key ? "bg-white text-slate-950 shadow-lg shadow-black/10" : "text-white/68 hover:bg-white/10 hover:text-white"}`}
              onClick={() => onNavigate(view.key)}
            >
              <Icon size={18} />
              {t(view.labelKey)}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-6">
        <button type="button" className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-sm font-bold text-white/72 transition hover:bg-white/10 hover:text-white" onClick={onLogout}>
          <LogOut size={17} />
          {t("logout")}
        </button>
      </div>
      </div>
    </aside>
  );
}

function Topbar({ t, activeView, busy, user, language, onLanguageChange, onRefresh, onShowInstructions }) {
  const canShowInstructions = ["contacts", "qr-contact", "ocr", "digital"].includes(activeView);

  return (
    <header className="flex min-h-18 items-center justify-between gap-4 rounded-[1.75rem] border border-slate-200/80 bg-white/82 px-5 py-4 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl max-[760px]:items-stretch max-[760px]:flex-col">
      <div>
        <p className="text-xs font-black uppercase tracking-normal text-slate-500">{viewEyebrow(activeView, t)}</p>
        <h2 className="mt-1 text-3xl font-black leading-none tracking-normal text-slate-950 max-[760px]:text-3xl">{viewTitle(activeView, t)}</h2>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <LanguageSwitcher language={language} onChange={onLanguageChange} />
        <Badge tone={user?.is_active ? "success" : "neutral"}>{user?.is_active ? t("verified") : t("session")}</Badge>
        {canShowInstructions && (
          <Button variant="outline" onPress={onShowInstructions} startContent={<HelpCircle size={17} />}>{t("instructionButton")}</Button>
        )}
        <Button variant="outline" onPress={onRefresh} isLoading={busy === "documents"} startContent={<RefreshCw size={17} />}>{t("refresh")}</Button>
      </div>
    </header>
  );
}

function ContactsView({ t, contacts, query, onQuery, onOpenManual, onOpenOcr, onOpenContact, onRemove, selectedIds, onSelectedIdsChange, bundle, bundles, busy, onCreateBundle, onSelectBundle, onDeleteBundle, onOpenBundle }) {
  const [showBundleTools, setShowBundleTools] = useState(true);
  const featuredContact = contacts[0];
  const selectedCount = selectedIds.length;
  const toggleContact = (contactId) => {
    onSelectedIdsChange(
      selectedIds.includes(contactId)
        ? selectedIds.filter((id) => id !== contactId)
        : [...selectedIds, contactId],
    );
  };

  return (
    <section className="grid grid-cols-12 gap-5">
      <div className="col-span-8 grid min-h-64 content-between overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#ffffff,rgba(248,250,252,0.88)),repeating-linear-gradient(135deg,rgba(15,23,42,0.035)_0_1px,transparent_1px_18px)] p-7 shadow-[0_26px_80px_rgba(15,23,42,0.07)] max-[1050px]:col-span-12">
        <div>
          <Badge tone="neutral">{t("curatedList")}</Badge>
          <h3 className="mt-4 max-w-3xl text-5xl font-black leading-none tracking-normal text-slate-950 max-[760px]:text-4xl">{t("contactsHeroTitle")}</h3>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{t("contactsHeroDesc")}</p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button className="inline-flex min-h-13 items-center gap-2 rounded-2xl bg-slate-950 px-5 font-black text-white shadow-lg shadow-slate-900/15" type="button" onClick={onOpenOcr}>
            <CloudUpload size={20} />
            <span>{t("quickCapture")}</span>
          </button>
          <button className="inline-flex min-h-13 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 font-black text-slate-950 shadow-sm" type="button" onClick={onOpenManual}>
            <UserPlus size={20} />
            <span>{t("addManual")}</span>
          </button>
        </div>
      </div>

      <div className="col-span-4 grid content-between rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_26px_80px_rgba(15,23,42,0.16)] max-[1050px]:col-span-12">
        <div>
          <span className="text-xs font-black uppercase text-white/45">{t("latestContact")}</span>
          <h3 className="mt-3 text-3xl font-black leading-none tracking-normal">{featuredContact?.name || t("emptyContactsTitle")}</h3>
          <p className="mt-3 text-sm leading-6 text-white/58">{featuredContact ? [featuredContact.position, featuredContact.company].filter(Boolean).join(" · ") || t("noCompany") : t("emptyContactsDesc")}</p>
        </div>
        {featuredContact ? (
          <button type="button" className="mt-6 grid min-h-20 grid-cols-[48px_minmax(0,1fr)_20px] items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.08] p-3 text-left text-white" onClick={() => onOpenContact(featuredContact.id)}>
            <Avatar value={featuredContact.name || featuredContact.company} />
            <span>
              <small className="block text-xs font-bold text-white/45">{t("latestContact")}</small>
              <strong className="block truncate text-sm font-black">{featuredContact.name || t("emptyName")}</strong>
            </span>
            <ChevronRight size={18} />
          </button>
        ) : (
          <Button variant="secondary" onPress={onOpenOcr} startContent={<Upload size={17} />}>{t("scanNewCard")}</Button>
        )}
      </div>

      <Card className="col-span-12 rounded-[2rem]">
        <Card.Header>
          <div>
            <Card.Title>{t("contactsTitle")}</Card.Title>
            <Card.Description>{t("contactsDesc")}</Card.Description>
          </div>
        </Card.Header>
        <Card.Content className="grid gap-5">
          <Toolbar>
            <TextField icon={<Search size={17} />} label={t("search")} value={query} onChange={onQuery} placeholder={t("searchContactsPlaceholder")} />
            {!!bundles?.length && (
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onPress={() => setShowBundleTools((value) => !value)}
                  startContent={<QrCode size={17} />}
                >
                  {showBundleTools ? t("hideBundleTools") : t("showBundleTools")}
                </Button>
              </div>
            )}
          </Toolbar>
          {showBundleTools && bundle?.qr_svg && (
            <div className="grid grid-cols-[minmax(0,1fr)_220px] items-center gap-5 rounded-[2rem] border border-slate-200 bg-slate-50 p-5 max-[760px]:grid-cols-1">
              <div>
                <Badge tone="success">{t("bundleQrTitle")}</Badge>
                <h3 className="mt-3 text-2xl font-black text-slate-950">{t("bundleQrTitle")}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{t("bundleQrDesc")}</p>
                <p className="mt-3 text-xs font-black uppercase tracking-normal text-slate-400">{t("selectedContacts", { count: bundle.total })}</p>
              </div>
              <div className="grid justify-items-center gap-3">
                <QrImageWithLogo svg={bundle.qr_svg} className="size-52 rounded-[1.5rem] [&_svg]:size-44" />
                <div className="flex flex-wrap justify-center gap-2">
                  <Button variant="outline" onPress={() => downloadQrImage(bundle.qr_svg, "cardly-bundle")} startContent={<Download size={17} />}>{t("downloadBundleQr")}</Button>
                </div>
              </div>
            </div>
          )}
          {showBundleTools && !!bundles?.length && (
            <div className="flex items-center gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-3 max-[760px]:items-start max-[760px]:flex-col">
              <div className="flex shrink-0 items-center gap-2">
                <strong className="text-sm font-black text-slate-950">{t("recentBundles")}</strong>
                <Badge tone="neutral">{bundles.length}</Badge>
              </div>
              <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1">
                {bundles.slice(0, 8).map((item) => (
                  <div key={item.id} className={`flex min-w-[15rem] items-center gap-2 rounded-xl border p-1.5 transition ${bundle?.id === item.id ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-slate-50 text-slate-950 hover:bg-white"}`}>
                    <button type="button" className="min-w-0 flex-1 px-3 text-left" onClick={() => onSelectBundle(item)}>
                      <strong className="block truncate text-xs font-black">{t("bundleQrTitle")}</strong>
                      <small className={`block truncate text-[11px] font-semibold ${bundle?.id === item.id ? "text-white/58" : "text-slate-500"}`}>{t("selectedContacts", { count: item.total })}</small>
                    </button>
                    <button className={`grid size-8 shrink-0 place-items-center rounded-lg border ${bundle?.id === item.id ? "border-white/18 bg-white/10 text-white" : "border-slate-200 bg-white text-slate-600"}`} type="button" onClick={() => onSelectBundle(item)} title={t("bundleQrTitle")}>
                      <QrCode size={14} />
                    </button>
                    <button className={`grid size-8 shrink-0 place-items-center rounded-lg border ${bundle?.id === item.id ? "border-white/18 bg-white/10 text-white" : "border-slate-200 bg-white text-slate-600"}`} type="button" onClick={() => onOpenBundle(item.id)} title={t("openBundlePage")}>
                      <Eye size={14} />
                    </button>
                    <button className="grid size-8 shrink-0 place-items-center rounded-lg border border-red-100 bg-red-50 text-red-600" type="button" onClick={() => onDeleteBundle(item.id)} title={t("deleteContact")}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {contacts.length ? (
            <div className="grid gap-3">
              <div className="flex flex-wrap items-center justify-end gap-2">
                {!!selectedCount && <Badge tone="neutral">{t("selectedContacts", { count: selectedCount })}</Badge>}
                <Button
                  variant="outline"
                  isDisabled={selectedCount < 2}
                  isLoading={busy === "contact-bundle"}
                  onPress={() => onCreateBundle(selectedIds)}
                  startContent={<QrCode size={17} />}
                >
                  {t("shareSelected")}
                </Button>
              </div>
              {contacts.map((contact) => (
                <ContactCard
                  t={t}
                  key={contact.id}
                  contact={contact}
                  isSelected={selectedIds.includes(contact.id)}
                  onToggleSelect={() => toggleContact(contact.id)}
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
    <section className="grid grid-cols-12 gap-5">
      <div className="col-span-12 min-h-48 rounded-[2rem] border border-slate-200 bg-white/80 p-7 shadow-[0_28px_90px_rgba(15,23,42,0.08)]">
        <div>
          <Badge tone="neutral">{t("navManual")}</Badge>
          <h3 className="mt-4 max-w-3xl text-5xl font-black leading-none tracking-normal text-slate-950 max-[760px]:text-4xl">{t("manualHeroTitle")}</h3>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{t("manualHeroDesc")}</p>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <span className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 font-bold"><UserPlus size={18} />Profile</span>
          <span className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 font-bold"><Building2 size={18} />Company</span>
          <span className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 font-bold"><Layers size={18} />Context</span>
        </div>
      </div>

      <Card className="col-span-12 rounded-[2rem]">
        <Card.Header>
          <div>
            <Card.Title>{t("manualTitle")}</Card.Title>
            <Card.Description>{t("manualDesc")}</Card.Description>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onPress={onBack} startContent={<ArrowLeft size={17} />}>{t("backContacts")}</Button>
            <Button variant="outline" onPress={onOpenOcr} startContent={<Upload size={17} />}>{t("switchOcr")}</Button>
          </div>
        </Card.Header>
        <Card.Content>
          <ManualContactForm t={t} busy={busy} onSubmit={onCreate} />
        </Card.Content>
      </Card>

    </section>
  );
}

function ContactDetailView({ t, contact, onBack, onOpenOcr, onRemove, onUpdate, busy }) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedQrIndex, setSelectedQrIndex] = useState(0);
  const [mediaTab, setMediaTab] = useState("business-card");

  useEffect(() => {
    setIsEditing(false);
    setSelectedImageIndex(0);
    setSelectedQrIndex(0);
    setMediaTab("business-card");
  }, [contact?.id]);

  if (!contact) {
    return (
      <section className="grid grid-cols-12 gap-5">
        <Card className="col-span-12">
          <Card.Content>
            <EmptyState
              icon={<ContactRound size={28} />}
              title={t("detailMissingTitle")}
              description={t("detailMissingDesc")}
            />
            <div className="flex flex-wrap gap-2">
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
  const isQrContact = String(contact.source || "").toLowerCase() === "digital qr" || (!!qrCodes.length && !imageUrls.length);
  const activeMediaTab = imageUrls.length ? mediaTab : "qr";
  const primaryQrCode = qrCodes[selectedQrIndex] || qrCodes[0];
  const primaryImage = imageUrls[selectedImageIndex] || imageUrls[0];

  return (
    <section className="grid grid-cols-12 gap-5">
      <Card className="col-span-12 rounded-[2.25rem]">
        <Card.Content className="grid min-h-[540px] grid-cols-[minmax(340px,0.74fr)_minmax(0,1.26fr)] gap-7 p-6 max-[1000px]:grid-cols-1">
          <div className="grid min-h-[460px] content-start gap-4 rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,rgba(15,23,42,0.10),rgba(255,255,255,0.45)),repeating-linear-gradient(135deg,rgba(15,23,42,0.04)_0_1px,transparent_1px_16px),#eef2f7] p-5">
            {!!(imageUrls.length || qrCodes.length) && (
              <div className="flex w-full justify-center">
                <div className="inline-flex rounded-full border border-slate-200 bg-white/84 p-1 shadow-sm backdrop-blur">
                  {!!imageUrls.length && (
                    <button
                      type="button"
                      className={`min-h-10 rounded-full px-4 text-xs font-black transition ${activeMediaTab === "business-card" ? "bg-slate-950 text-white shadow-lg shadow-slate-900/16" : "text-slate-500 hover:text-slate-950"}`}
                      onClick={() => setMediaTab("business-card")}
                    >
                      {t("businessCardImages")}
                    </button>
                  )}
                  {!!qrCodes.length && (
                    <button
                      type="button"
                      className={`min-h-10 rounded-full px-4 text-xs font-black transition ${activeMediaTab === "qr" ? "bg-slate-950 text-white shadow-lg shadow-slate-900/16" : "text-slate-500 hover:text-slate-950"}`}
                      onClick={() => setMediaTab("qr")}
                    >
                      QR
                    </button>
                  )}
                </div>
              </div>
            )}

            {activeMediaTab === "qr" && primaryQrCode ? (
              <>
                <div className="grid min-h-80 w-full place-items-center">
                  <div className="grid justify-items-center gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/10">
                    <GeneratedQrWithLogo value={primaryQrCode} className="size-64 rounded-[1.75rem]" imageClassName="size-56" logoClassName="size-11 rounded-2xl p-1" />
                    <span className="inline-flex min-h-9 items-center gap-2 rounded-full bg-slate-950 px-4 text-xs font-black uppercase tracking-normal text-white">
                      <QrCode size={15} />
                      QR contact
                    </span>
                    <button
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                      type="button"
                      onClick={() => downloadGeneratedQrImage(primaryQrCode, name || "contact")}
                    >
                      <Download size={16} />
                      {t("downloadQr")}
                    </button>
                  </div>
                </div>
                {qrCodes.length > 1 && (
                  <div className="flex justify-center gap-2">
                    {qrCodes.map((value, index) => (
                      <button
                        key={`${value}-${index}`}
                        type="button"
                        className={`size-16 overflow-hidden rounded-2xl border bg-white p-1 transition ${selectedQrIndex === index ? "border-slate-950 ring-4 ring-slate-950/10" : "border-slate-200 opacity-60"}`}
                        onClick={() => setSelectedQrIndex(index)}
                      >
                        <GeneratedQrWithLogo value={value} className="size-full rounded-xl shadow-none" imageClassName="size-12" logoClassName="size-5 rounded-md p-0.5" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : activeMediaTab === "business-card" && primaryImage ? (
              <>
                <a className="grid min-h-80 w-full place-items-center" href={primaryImage} target="_blank" rel="noreferrer">
                  <img className="max-h-80 max-w-full rotate-[-1.5deg] rounded-2xl object-contain shadow-2xl shadow-slate-900/20" src={primaryImage} alt={`${name} business card`} />
                </a>
                {imageUrls.length > 1 && (
                  <div className="flex justify-center gap-2">
                    {imageUrls.map((url, index) => (
                      <button
                        key={url}
                        type="button"
                        className={`size-16 overflow-hidden rounded-2xl border bg-white p-1 transition ${selectedImageIndex === index ? "border-slate-950 ring-4 ring-slate-950/10" : "border-slate-200 opacity-60"}`}
                        onClick={() => setSelectedImageIndex(index)}
                      >
                        <img className="size-full rounded-xl object-cover" src={url} alt={`Business card ${index + 1}`} />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="grid justify-items-center gap-3 text-slate-500">
                <QrCode size={30} />
                <span>{t("businessCardImages")}</span>
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col justify-center gap-5">
            <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-5 max-[760px]:grid-cols-1">
              <span className="grid size-[7.5rem] place-items-center rounded-full border-[6px] border-white bg-slate-950 text-4xl font-black text-white shadow-2xl shadow-slate-900/20">{initials(name || contact.company)}</span>
              <div>
                <div className="mb-3 flex flex-wrap gap-2">
                  <Badge tone="neutral">{contact.source || t("personalContact")}</Badge>
                  {!!imageUrls.length && <Badge tone="success">{t("imagesCount", { count: imageUrls.length })}</Badge>}
                  {isQrContact && !!qrCodes.length && <Badge tone="success">QR contact</Badge>}
                </div>
                <h3 className="text-6xl font-black leading-none tracking-normal text-slate-950 max-[900px]:text-4xl">{name}</h3>
                <p className="mt-3 text-lg font-semibold leading-7 text-slate-600">{subtitle}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {contact.email && <a className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 font-bold text-slate-950 no-underline shadow-sm" href={`mailto:${contact.email}`}><Mail size={17} />Email</a>}
              {contact.phone && <a className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 font-bold text-slate-950 no-underline shadow-sm" href={`tel:${contact.phone}`}><Phone size={17} />{t("phone")}</a>}
              {contact.website && <a className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 font-bold text-slate-950 no-underline shadow-sm" href={asExternalUrl(contact.website)} target="_blank" rel="noreferrer"><Link size={17} />Website</a>}
            </div>

            <div className="flex flex-wrap gap-2">
              {[...tags, ...keywords].slice(0, 8).map((item) => (
                <Badge key={item} tone="neutral">{item}</Badge>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
              <Button variant="outline" onPress={onBack} startContent={<ArrowLeft size={17} />}>{t("back")}</Button>
              <Button variant="outline" onPress={() => setIsEditing((current) => !current)} startContent={<Pencil size={17} />}>
                {isEditing ? t("cancelEdit") : t("editContact")}
              </Button>
              <Button variant="danger" onPress={() => onRemove(contact.id)} startContent={<Trash2 size={17} />}>{t("deleteContact")}</Button>
            </div>

            <div className="grid grid-cols-3 gap-3 max-[900px]:grid-cols-1">
              <span className="flex min-h-16 min-w-0 items-center gap-2 truncate rounded-2xl border border-slate-200 bg-white/80 px-3 text-sm font-bold text-slate-600"><Building2 size={16} />{contact.company || t("noCompany")}</span>
              <span className="flex min-h-16 min-w-0 items-center gap-2 truncate rounded-2xl border border-slate-200 bg-white/80 px-3 text-sm font-bold text-slate-600"><CalendarDays size={16} />{formatDateTime(contact.confirmed_at) || "-"}</span>
              <span className="flex min-h-16 min-w-0 items-center gap-2 truncate rounded-2xl border border-slate-200 bg-white/80 px-3 text-sm font-bold text-slate-600"><Layers size={16} />{contact.processing_id}</span>
            </div>
          </div>
        </Card.Content>
      </Card>

      {isEditing && (
        <Card className="col-span-12 rounded-[2rem]">
          <Card.Header>
            <div>
              <Card.Title>{t("editContact")}</Card.Title>
              <Card.Description>{t("contactInfoDesc")}</Card.Description>
            </div>
          </Card.Header>
          <Card.Content>
            <ManualContactForm
              t={t}
              busy={busy}
              initialValues={contactToForm(contact)}
              submitLabel={t("saveEdits")}
              busyKey="contact-update"
              onCancel={() => setIsEditing(false)}
              onSubmit={async (form) => {
                const updated = await onUpdate(contact.id, form);
                if (updated) setIsEditing(false);
              }}
            />
          </Card.Content>
        </Card>
      )}

      <Card className="col-span-7 rounded-[2rem] max-[1000px]:col-span-12">
        <Card.Header>
          <div>
            <Card.Title>{t("contactInfo")}</Card.Title>
            <Card.Description>{t("contactInfoDesc")}</Card.Description>
          </div>
        </Card.Header>
        <Card.Content>
          <dl className="m-0 grid grid-cols-2 gap-3 max-[760px]:grid-cols-1">
            <DetailRow label="Email" value={contact.email} icon={<Mail size={17} />} type="email" />
            <DetailRow label={t("phone")} value={contact.phone} icon={<Phone size={17} />} type="phone" />
            <DetailRow label="Website" value={contact.website} icon={<Link size={17} />} type="url" />
            <DetailRow label={t("address")} value={contact.address} icon={<MapPin size={17} />} />
            <DetailRow label={t("company")} value={contact.company} />
            <DetailRow label={t("position")} value={contact.position} />
          </dl>
        </Card.Content>
      </Card>

      <Card className="col-span-5 rounded-[2rem] max-[1000px]:col-span-12">
        <Card.Header>
          <Card.Title>{t("insight")}</Card.Title>
          <Card.Description>{t("insightDesc")}</Card.Description>
        </Card.Header>
        <Card.Content>
          <div>
            <h4 className="mb-3 text-xs font-black uppercase tracking-normal text-slate-500">{t("summary")}</h4>
            <p className="m-0 leading-7 text-slate-700">{contact.professional_brief || t("noSummary")}</p>
          </div>
          {contact.notes && (
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <h4 className="mb-2 text-xs font-black uppercase tracking-normal text-slate-500">{t("notes")}</h4>
              <p className="m-0 leading-7 text-slate-700">{contact.notes}</p>
            </div>
          )}
          <InsightList title={t("highlights")} items={highlights} />
          <InsightList title="Social profiles" items={socialProfiles} />
        </Card.Content>
      </Card>

      <Card className="col-span-12 rounded-[2rem]">
        <Card.Header>
          <Card.Title>{t("meetingContext")}</Card.Title>
          <Card.Description>{t("meetingContextDesc")}</Card.Description>
        </Card.Header>
        <Card.Content>
          <dl className="m-0 grid grid-cols-5 gap-3 max-[1180px]:grid-cols-3 max-[760px]:grid-cols-1">
            <DetailRow label={t("event")} value={contact.event_name} />
            <DetailRow label={t("location")} value={contact.location} />
            <DetailRow label={t("source")} value={contact.source} />
            <DetailRow label="Processing ID" value={contact.processing_id} />
            <DetailRow label={t("confirmedAt")} value={formatDateTime(contact.confirmed_at)} />
          </dl>
        </Card.Content>
      </Card>

    </section>
  );
}

function QrContactView({ t, busy, file, onFileChange, uploadProgress, onBack, onUpload }) {
  const isLoading = busy === "qr-contact";

  return (
    <section className="grid grid-cols-12 gap-5">
      <div className="col-span-12 rounded-[2rem] border border-slate-200 bg-white/80 p-7 shadow-[0_28px_90px_rgba(15,23,42,0.08)]">
        <Badge tone="neutral">{t("navQrContact")}</Badge>
        <h3 className="mt-4 max-w-3xl text-5xl font-black leading-none tracking-normal text-slate-950 max-[760px]:text-4xl">{t("qrContactTitle")}</h3>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{t("qrContactDesc")}</p>
      </div>

      <Card className="col-span-7 rounded-[2rem] max-[1000px]:col-span-12">
        <Card.Header>
          <div>
            <Card.Title>{t("qrContactUpload")}</Card.Title>
            <Card.Description>{t("qrContactHint")}</Card.Description>
          </div>
        </Card.Header>
        <Card.Content className="grid gap-4">
          <FilePicker label={t("qrContactUpload")} chooseLabel={t("chooseImage")} file={file} onChange={onFileChange} />
          <Button variant="primary" full onPress={onUpload} isLoading={isLoading} startContent={<QrCode size={18} />}>{t("qrContactButton")}</Button>
          {isLoading && (
            <ProgressPanel
              title={t("uploadRunningTitle")}
              description={t("uploadRunningDesc")}
              label={t("uploadProgress")}
              value={uploadProgress}
              icon={<CloudUpload size={22} />}
            />
          )}
        </Card.Content>
      </Card>

      <Card className="col-span-5 rounded-[2rem] max-[1000px]:col-span-12">
        <Card.Header>
          <Card.Title>Cardly QR</Card.Title>
          <Card.Description>{t("qrContactHint")}</Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="grid min-h-72 place-items-center rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <div className="grid justify-items-center gap-3">
              <span className="grid size-16 place-items-center rounded-3xl bg-slate-950 text-white">
                <QrCode size={30} />
              </span>
              <strong className="text-lg font-black text-slate-950">{t("qrContactButton")}</strong>
              <p className="max-w-sm text-sm font-semibold leading-6 text-slate-500">{t("qrContactDesc")}</p>
              <Button variant="outline" onPress={onBack} startContent={<ArrowLeft size={17} />}>{t("backContacts")}</Button>
            </div>
          </div>
        </Card.Content>
      </Card>
    </section>
  );
}

function ManualContactForm({ t, busy, onSubmit, initialValues = {}, submitLabel, busyKey = "manual-contact", onCancel }) {
  const emptyForm = {
    name: "",
    company: "",
    position: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    professional_brief: "",
    event_name: "",
    location: "",
    tags: "",
    notes: "",
  };
  const [form, setForm] = useState({ ...emptyForm, ...initialValues });

  useEffect(() => {
    setForm({ ...emptyForm, ...initialValues });
  }, [initialValues.name, initialValues.email, initialValues.phone, initialValues.company]);

  return (
    <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}>
      <div className="grid grid-cols-2 gap-3 max-[760px]:grid-cols-1">
        <TextField label={t("name")} value={form.name} onChange={(name) => setForm({ ...form, name })} />
        <TextField label={t("company")} value={form.company} onChange={(company) => setForm({ ...form, company })} />
        <TextField label={t("position")} value={form.position} onChange={(position) => setForm({ ...form, position })} />
        <TextField icon={<Mail size={17} />} label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
        <TextField label={t("phone")} value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />
        <TextField icon={<Link size={17} />} label="Website" value={form.website} onChange={(website) => setForm({ ...form, website })} />
        <TextField label={t("address")} value={form.address} onChange={(address) => setForm({ ...form, address })} />
        <TextField label={t("event")} value={form.event_name} onChange={(event_name) => setForm({ ...form, event_name })} />
        <TextField label={t("location")} value={form.location} onChange={(location) => setForm({ ...form, location })} />
        <TextField label={t("summary")} value={form.professional_brief} onChange={(professional_brief) => setForm({ ...form, professional_brief })} />
        <TextField label="Tags" value={form.tags} onChange={(tags) => setForm({ ...form, tags })} placeholder="ai, sales, investor" />
        <TextField label={t("notes")} value={form.notes} onChange={(notes) => setForm({ ...form, notes })} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" type="submit" isLoading={busy === busyKey} startContent={<Save size={17} />}>{submitLabel || t("createContact")}</Button>
        {onCancel && <Button variant="outline" onPress={onCancel}>{t("cancelEdit")}</Button>}
      </div>
    </form>
  );
}

function OcrView(props) {
  const [step, setStep] = useState(props.selectedId ? "review" : "upload");
  const [ocrProgress, setOcrProgress] = useState(0);
  const isOcrLoading = props.busy === "review";
  const isUploadLoading = props.busy === "upload";

  useEffect(() => {
    if (props.review) setStep("review");
    else if (props.selectedId) setStep("queue");
  }, [props.selectedId, props.review]);

  useEffect(() => {
    if (!isOcrLoading) {
      if (props.review) setOcrProgress(100);
      return undefined;
    }

    setOcrProgress(8);
    const timer = window.setInterval(() => {
      setOcrProgress((current) => {
        if (current >= 94) return current;
        if (current < 38) return current + 7;
        if (current < 72) return current + 4;
        return current + 2;
      });
    }, 520);

    return () => window.clearInterval(timer);
  }, [isOcrLoading, props.review]);

  const steps = [
    { key: "upload", label: "1. Upload", icon: CloudUpload },
    { key: "queue", label: "2. Queue", icon: Layers },
    { key: "review", label: "3. Review", icon: ShieldCheck },
  ];

  return (
    <section className="grid grid-cols-12 gap-5">
      <div className="col-span-12 min-h-48 rounded-[2rem] border border-slate-200 bg-white/80 p-7 shadow-[0_28px_90px_rgba(15,23,42,0.08)]">
        <div>
          <Badge tone="neutral">{props.t("eyebrowOcr")}</Badge>
          <h3 className="mt-4 max-w-3xl text-5xl font-black leading-none tracking-normal text-slate-950 max-[760px]:text-4xl">{props.t("ocrResult")}</h3>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{props.t("ocrResultDesc")}</p>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3 max-[760px]:grid-cols-1">
          {steps.map((item) => {
            const Icon = item.icon;
            const active = step === item.key;
            return (
              <button
                key={item.key}
                type="button"
                className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-4 font-bold transition ${active ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700"}`}
                onClick={() => setStep(item.key)}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {step === "upload" && <Card className="col-span-12 rounded-[2rem]">
        <Card.Header>
          <Card.Title>{props.t("uploadOcr")}</Card.Title>
          <Card.Description>{props.t("uploadDesc")}</Card.Description>
        </Card.Header>
        <Card.Content className="grid grid-cols-2 gap-4 max-[760px]:grid-cols-1">
          <FilePicker label={props.t("uploadFront")} chooseLabel={props.t("chooseImage")} file={props.uploadFiles.file} onChange={(file) => props.setUploadFiles((current) => ({ ...current, file }))} />
          <FilePicker label={props.t("uploadBack")} chooseLabel={props.t("chooseImage")} file={props.uploadFiles.file2} onChange={(file) => props.setUploadFiles((current) => ({ ...current, file2: file }))} />
          <div className="col-span-2 max-[760px]:col-span-1">
            <Button variant="primary" full onPress={props.onUpload} isLoading={isUploadLoading} startContent={<CloudUpload size={18} />}>{props.t("uploadOcr")}</Button>
            {isUploadLoading && (
              <ProgressPanel
                className="mt-4"
                title={props.t("uploadRunningTitle")}
                description={props.t("uploadRunningDesc")}
                label={props.t("uploadProgress")}
                value={props.uploadProgress}
                icon={<CloudUpload size={22} />}
              />
            )}
          </div>
        </Card.Content>
      </Card>}

      {step === "queue" && <Card className="col-span-4 rounded-[2rem] max-[1100px]:col-span-12">
        <Card.Header>
          <div>
            <Card.Title>{props.t("scanQueue")}</Card.Title>
            <Card.Description>{props.t("scanQueueDesc", { count: props.documents.length })}</Card.Description>
          </div>
        </Card.Header>
        <Card.Content>
          <TextField icon={<Search size={17} />} label={props.t("findScan")} value={props.scanQuery} onChange={props.onScanQuery} placeholder={props.t("scanPlaceholder")} />
          <div className="mt-4 grid max-h-[680px] gap-3 overflow-auto">
            {props.documents.length ? props.documents.map((doc) => (
              <div
                key={doc.processing_id}
                className={`grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-2xl border p-3 text-left transition ${props.selectedId === doc.processing_id ? "border-slate-950 bg-slate-50 ring-4 ring-slate-950/10" : "border-slate-200 bg-white hover:border-slate-300"}`}
              >
                <button type="button" className="min-w-0 text-left" onClick={() => props.onSelect(doc.processing_id)}>
                  <strong className="block truncate text-sm font-black">{doc.original_filename || "Business card"}</strong>
                  <small className="mt-1 block truncate text-xs font-semibold text-slate-500">{doc.processing_id}</small>
                </button>
                <span className="flex items-center gap-2">
                  <button
                    type="button"
                    className="grid size-9 place-items-center rounded-full border border-red-100 bg-red-50 text-red-600"
                    onClick={(event) => {
                      event.stopPropagation();
                      props.onDelete(doc.processing_id);
                    }}
                    title={props.t("deleteScan")}
                  >
                    <Trash2 size={15} />
                  </button>
                </span>
              </div>
            )) : (
              <EmptyState icon={<FileText size={24} />} title={props.t("emptyScansTitle")} description={props.t("emptyScansDesc")} />
            )}
          </div>
        </Card.Content>
      </Card>}

      {step === "queue" && <Card className="col-span-8 rounded-[2rem] max-[1100px]:col-span-12">
        <Card.Header>
          <Card.Title>{props.t("preview")}</Card.Title>
          <Card.Description>{props.selectedDocument?.processing_id || props.t("noSelectedScan")}</Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="grid min-h-[720px] gap-4">
            {props.previewUrls.length ? props.previewUrls.map((url) => (
              <img className="min-h-[520px] w-full rounded-[1.75rem] border border-slate-200 bg-slate-50 object-contain shadow-lg shadow-slate-900/10" key={url} src={url} alt="Business card preview" />
            )) : (
              <div className="grid min-h-[560px] w-full place-items-center rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">{props.t("previewEmpty")}</div>
            )}
            <Button
              variant="primary"
              full
              onPress={() => {
                setStep("review");
                props.onLoadReview();
              }}
              isDisabled={!props.selectedId}
              isLoading={props.busy === "review"}
              startContent={<Sparkles size={17} />}
            >
              {props.t("runOcr")}
            </Button>
          </div>
        </Card.Content>
      </Card>}

      {step === "review" && <Card className="col-span-12 rounded-[2rem]">
        <Card.Header>
          <div>
            <Card.Title>{props.t("ocrResult")}</Card.Title>
            <Card.Description>{props.t("ocrResultDesc")}</Card.Description>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onPress={props.onConfirm} isDisabled={!props.review} isLoading={props.busy === "confirm"} startContent={<Check size={17} />}>{props.t("saveContact")}</Button>
          </div>
        </Card.Header>
        <Card.Content>
          {isOcrLoading && (
            <ProgressPanel
              className="mb-4"
              title={props.t("ocrRunningTitle")}
              description={props.t("ocrRunningDesc")}
              label={props.t("ocrProgress")}
              value={ocrProgress}
              detail={props.selectedId}
              icon={<Loader2 className="animate-spin" size={22} />}
            />
          )}
          <ReviewEditor
            review={props.review}
            data={props.reviewDraft}
            context={props.contextDraft}
            busy={props.busy}
            t={props.t}
            onDataChange={props.setReviewDraft}
            onContextChange={props.setContextDraft}
          />
        </Card.Content>
      </Card>}
    </section>
  );
}

function ContactCard({ t, contact, isSelected = false, onToggleSelect, onOpen, onRemove }) {
  const tags = normalizeList(contact.tags);
  const keywords = normalizeList(contact.keywords);

  return (
    <article className="group relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white/90 shadow-sm transition hover:border-slate-300 hover:bg-white hover:shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
      <div className="absolute inset-y-0 left-0 w-1 bg-slate-950 opacity-0 transition group-hover:opacity-100" />
      <button
        className={`absolute left-4 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full border transition ${isSelected ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-400 hover:text-slate-950"}`}
        type="button"
        onClick={onToggleSelect}
        title={t("selectContacts")}
      >
        {isSelected ? <Check size={17} /> : <Plus size={17} />}
      </button>
      <button className="grid w-full grid-cols-[56px_minmax(180px,0.9fr)_minmax(320px,1.35fr)_44px] items-center gap-4 p-4 pl-[4.5rem] pr-16 text-left text-slate-950 max-[1050px]:grid-cols-[56px_minmax(0,1fr)_44px] max-[1050px]:pr-14" type="button" onClick={onOpen}>
        <div className="grid size-14 place-items-center rounded-2xl bg-slate-50">
          <Avatar value={contact.name || contact.company || "C"} />
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-lg font-black tracking-normal">{contact.name || t("emptyName")}</h3>
          <p className="mt-1 truncate text-sm font-semibold text-slate-500">{[contact.position, contact.company].filter(Boolean).join(" · ") || t("noCompany")}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 max-[1050px]:col-span-2 max-[1050px]:grid-cols-1">
          <span className="flex min-h-10 min-w-0 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-600">
            <Mail className="shrink-0" size={14} />
            <span className="min-w-0 truncate">{contact.email || "-"}</span>
          </span>
          <span className="flex min-h-10 min-w-0 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-600">
            <Phone className="shrink-0" size={14} />
            <span className="min-w-0 truncate">{contact.phone || "-"}</span>
          </span>
          <span className="flex min-h-10 min-w-0 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-600">
            <MapPin className="shrink-0" size={14} />
            <span className="min-w-0 truncate">{[contact.event_name, contact.location].filter(Boolean).join(" · ") || "-"}</span>
          </span>
        </div>
        <div className="grid size-10 place-items-center justify-self-end rounded-full border border-slate-200 bg-white text-slate-500 max-[1050px]:row-start-1 max-[1050px]:col-start-3">
          <Globe2 size={15} />
        </div>
      </button>
      {!!(keywords.length || tags.length) && (
        <div className="flex flex-wrap gap-2 px-4 pb-4 pl-[5.25rem] max-[760px]:pl-4">
          {[...keywords, ...tags].slice(0, 4).map((item) => <Badge key={item} tone="neutral">{item}</Badge>)}
        </div>
      )}
      <button className="absolute right-4 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100 max-[1050px]:bottom-4 max-[1050px]:top-auto max-[1050px]:translate-y-0" type="button" onClick={onRemove} title={t("deleteContact")}>
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
    <div className="grid min-h-24 content-center rounded-2xl border border-slate-200 bg-white/80 p-4">
      <dt className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-normal text-slate-500">{icon}{label}</dt>
      <dd className="m-0 break-words text-sm font-bold text-slate-950 [&_a]:text-slate-950 [&_a]:no-underline hover:[&_a]:underline">{content}</dd>
    </div>
  );
}

function InsightList({ title, items }) {
  if (!items.length) return null;
  return (
    <div className="mt-5 border-t border-slate-200 pt-5">
      <h4 className="mb-3 text-xs font-black uppercase tracking-normal text-slate-500">{title}</h4>
      <ul className="m-0 grid gap-2 pl-5">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function ContactQrCodes({ title, items }) {
  if (!items.length) return null;
  return (
    <div className="mt-5 border-t border-slate-200 pt-5">
      <h4 className="mb-3 text-xs font-black uppercase tracking-normal text-slate-500">{title}</h4>
      <div className="grid grid-cols-2 gap-3 max-[560px]:grid-cols-1">
        {items.map((item, index) => (
          <div key={`${item}-${index}`} className="grid justify-items-center gap-3 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
            <GeneratedQrWithLogo value={item} className="size-40 rounded-2xl" imageClassName="size-32" logoClassName="size-9 rounded-xl p-1" />
            <span className="text-xs font-black uppercase tracking-normal text-slate-500">QR {index + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function qrImageSource(value) {
  const text = String(value || "").trim();
  if (/^(data:image\/|https?:\/\/.+\.(png|jpe?g|webp|gif|svg)(\?.*)?$)/i.test(text)) return text;
  return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=16&ecc=H&data=${encodeURIComponent(text)}`;
}

function asExternalUrl(value) {
  return String(value || "").startsWith("http") ? value : `https://${value}`;
}

function normalizeZaloPhone(value) {
  const raw = String(value || "").trim();
  const fromUrl = raw.match(/zalo\.me\/([^/?#]+)/i)?.[1] || raw;
  return fromUrl.replace(/[^\d+]/g, "");
}

function asZaloUrl(value) {
  const phone = normalizeZaloPhone(value).replace(/^\+/, "");
  return phone ? `https://zalo.me/${phone}` : asExternalUrl(value);
}

function contactIconTone(label) {
  const key = String(label || "").toLowerCase();
  if (key === "phone") return "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200";
  if (key === "email") return "bg-sky-50 text-sky-600 ring-1 ring-sky-200";
  if (key === "zalo") return "bg-cyan-50 text-cyan-600 ring-1 ring-cyan-200";
  if (key === "linkedin") return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";
  if (key === "website") return "bg-violet-50 text-violet-600 ring-1 ring-violet-200";
  if (key === "address") return "bg-rose-50 text-rose-600 ring-1 ring-rose-200";
  if (key.startsWith("social")) return "bg-amber-50 text-amber-600 ring-1 ring-amber-200";
  return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
}

function ProgressPanel({ title, description, label, value, detail, icon, className = "" }) {
  const progress = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div className={`${className} grid gap-4 rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white shadow-lg`}>
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/10">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <strong className="block">{title}</strong>
          <span className="text-sm text-white/60">{description}</span>
        </div>
        <span className="text-sm font-black">{progress}%</span>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between gap-3 text-xs font-bold text-white/50">
          <span>{label}</span>
          {detail && <span className="truncate">{detail}</span>}
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-white transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function ReviewEditor({ t, review, data, context, onDataChange, onContextChange }) {
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
    <div className="grid gap-5">
      <div className="grid grid-cols-3 gap-3 max-[1050px]:grid-cols-2 max-[760px]:grid-cols-1">
        {REVIEW_FIELDS.map((field) => (
          <TextField
            key={field}
            label={field}
            value={fieldValue(field)}
            onChange={(value) => onDataChange({ ...data, [field]: value })}
          />
        ))}
      </div>
      <div className="grid gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
        <h4 className="m-0 text-sm font-black text-slate-950">Context</h4>
        <div className="grid grid-cols-2 gap-3 max-[760px]:grid-cols-1">
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
    </div>
  );
}

function DigitalCardView({ t, user, card, busy, onSave, onProfileSave, onAvatarUpload, onAvatarDelete, avatarHistory = [], uploadProgress = 0 }) {
  const [form, setForm] = useState(() => digitalCardForm(card, user));
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarSource, setAvatarSource] = useState("url");

  useEffect(() => {
    setForm(digitalCardForm(card, user));
    setAvatarUrl(user?.avatar_url || "");
    setAvatarFile(null);
    setAvatarSource("url");
  }, [card, user]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview("");
      return undefined;
    }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  const displayName = form.full_name || t("yourName");
  const headline = [form.title, form.company].filter(Boolean).join(" · ") || t("titleCompany");
  const highlightItems = splitList(form.highlights);
  const accountSlug = emailSlug(user?.email || form.email || form.slug);
  const shareUrl = accountSlug ? `${window.location.origin}/card/${accountSlug}` : "";
  const savedProfilePhoto = avatarUrl || user?.avatar_url || form.photo_url;
  const profilePhoto = avatarSource === "file" ? avatarPreview || user?.avatar_url || form.photo_url : savedProfilePhoto;

  function changeAvatarSource(source) {
    setAvatarSource(source);
    if (source === "url") {
      setAvatarFile(null);
      setAvatarUrl(user?.avatar_url || form.photo_url || "");
    } else {
      setAvatarUrl("");
    }
  }

  async function uploadSelectedAvatar() {
    const payload = await onAvatarUpload(avatarFile);
    if (payload?.avatar_url) {
      setAvatarUrl(payload.avatar_url);
      setAvatarFile(null);
      setAvatarSource("url");
    }
  }

  function selectRecentAvatar(url) {
    setAvatarSource("url");
    setAvatarFile(null);
    setAvatarUrl(url);
  }

  return (
    <section className="grid grid-cols-12 gap-5">
      <div className="col-span-12 min-h-48 rounded-[2rem] border border-slate-200 bg-white/80 p-7 shadow-[0_28px_90px_rgba(15,23,42,0.08)]">
        <div>
          <Badge tone="neutral">{t("eyebrowDigital")}</Badge>
          <h3 className="mt-4 max-w-3xl text-5xl font-black leading-none tracking-normal text-slate-950 max-[760px]:text-4xl">{t("digitalHeroTitle")}</h3>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{t("digitalHeroDesc")}</p>
        </div>
        <div className="flex min-w-80 items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white/85 p-4 shadow-lg max-[760px]:min-w-0">
          <Avatar value={displayName} src={profilePhoto} />
          <span className="min-w-0">
            <strong className="block truncate text-sm font-black">{displayName}</strong>
            <small className="block truncate text-xs font-semibold text-slate-500">{headline}</small>
          </span>
          <QrCode size={22} />
        </div>
      </div>

      <Card className="col-span-7 rounded-[2rem] max-[1050px]:col-span-12">
        <Card.Header>
          <div>
            <Card.Title>{t("digitalTitle")}</Card.Title>
            <Card.Description>{t("digitalDesc")}</Card.Description>
          </div>
        </Card.Header>
        <Card.Content>
          <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); onSave({ ...form, photo_url: savedProfilePhoto }); }}>
            <div className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(135deg,#f8fafc,#ffffff)] p-4">
              <div className="flex items-start justify-between gap-3 max-[640px]:grid">
                <div className="flex min-w-0 items-center gap-3">
                  {profilePhoto ? (
                    <img className="h-20 w-20 shrink-0 rounded-3xl border border-white object-cover object-center shadow-[0_16px_38px_rgba(15,23,42,0.16)]" src={profilePhoto} alt={displayName} />
                  ) : (
                    <Avatar value={displayName} />
                  )}
                  <div className="min-w-0">
                    <Badge tone="neutral">Avatar</Badge>
                    <strong className="mt-2 block text-lg font-black text-slate-950">{t("avatarPanelTitle")}</strong>
                    <p className="mt-1 max-w-md text-sm font-semibold leading-6 text-slate-500">{t("avatarPanelDesc")}</p>
                  </div>
                </div>
              </div>
              <Tabs
                value={avatarSource}
                onValueChange={changeAvatarSource}
                items={[
                  { key: "url", label: t("avatarSourceUrl") },
                  { key: "file", label: t("avatarSourceFile") },
                ]}
              />
              {avatarSource === "url" ? (
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 max-[760px]:grid-cols-1">
                  <TextField label={t("avatarUrl")} value={avatarUrl} onChange={setAvatarUrl} placeholder={t("avatarUrlPlaceholder")} />
                  <Button variant="outline" onPress={() => onProfileSave({ avatar_url: avatarUrl })} isLoading={busy === "profile-update"} startContent={<Save size={17} />}>{t("updateAvatar")}</Button>
                </div>
              ) : (
                <div className="grid gap-2">
                  <FilePicker label={t("avatarFile")} chooseLabel={t("chooseAvatar")} file={avatarFile} onChange={setAvatarFile} />
                  <Button
                    variant="secondary"
                    onPress={uploadSelectedAvatar}
                    isDisabled={!avatarFile}
                    isLoading={busy === "avatar-upload"}
                    startContent={<Upload size={17} />}
                  >
                    {t("uploadAvatarFile")}
                  </Button>
                </div>
              )}
              {busy === "avatar-upload" && (
                <ProgressPanel
                  title={t("uploadRunningTitle")}
                  description={t("uploadRunningDesc")}
                  label={t("uploadProgress")}
                  value={uploadProgress}
                  icon={<Upload size={22} />}
                />
              )}
              {!!avatarHistory.length && (
                <div className="grid gap-2 rounded-[1.25rem] border border-slate-200 bg-white/80 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-sm font-black text-slate-950">{t("recentAvatars")}</strong>
                    <span className="text-xs font-bold text-slate-500">{avatarHistory.length}/5</span>
                  </div>
                  <p className="m-0 text-xs font-semibold leading-5 text-slate-500">{t("recentAvatarsDesc")}</p>
                  <div className="flex flex-wrap gap-2">
                    {avatarHistory.map((avatar) => {
                      const active = avatar.url === savedProfilePhoto;
                      return (
                        <span key={avatar.id || avatar.url} className="relative h-16 w-16 shrink-0">
                          <button
                            type="button"
                            className={`grid h-14 w-14 overflow-hidden rounded-2xl border bg-white p-1 transition ${active ? "border-slate-950 ring-4 ring-slate-950/10" : "border-slate-200 hover:border-slate-400"}`}
                            onClick={() => selectRecentAvatar(avatar.url)}
                            aria-label={t("recentAvatars")}
                          >
                            <img className="block h-full w-full rounded-xl object-cover object-center" src={avatar.url} alt="" />
                          </button>
                          <button
                            type="button"
                            className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full border border-red-100 bg-red-50 text-red-600 shadow-sm transition hover:bg-red-100"
                            onClick={() => onAvatarDelete(avatar.id)}
                            aria-label={t("confirmDelete")}
                            disabled={busy === "avatar-delete"}
                          >
                            <Trash2 size={13} />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex items-center gap-2">
                <Badge tone="neutral">Profile</Badge>
                <strong>{t("digitalProfileSection")}</strong>
              </div>
              <div className="grid grid-cols-2 gap-3 max-[760px]:grid-cols-1">
                <TextField label={t("fullName")} value={form.full_name} onChange={(full_name) => setForm({ ...form, full_name })} />
                <TextField label={t("position")} value={form.title} onChange={(title) => setForm({ ...form, title })} />
                <TextField label={t("company")} value={form.company} onChange={(company) => setForm({ ...form, company })} />
              </div>
              <TextField label="Bio" value={form.bio} onChange={(bio) => setForm({ ...form, bio })} />
            </div>

            <div className="grid gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex items-center gap-2">
                <Badge tone="neutral">Links</Badge>
                <strong>{t("digitalContactSection")}</strong>
              </div>
              <div className="grid grid-cols-2 gap-3 max-[760px]:grid-cols-1">
                <TextField label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
                <TextField label="Phone" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />
                <TextField label={t("zaloPhone")} value={form.zalo} onChange={(zalo) => setForm({ ...form, zalo })} placeholder={t("zaloPhonePlaceholder")} />
                <TextField label="LinkedIn" value={form.linkedin} onChange={(linkedin) => setForm({ ...form, linkedin })} />
                <TextField label="Website" value={form.website} onChange={(website) => setForm({ ...form, website })} />
              </div>
            </div>

            <div className="grid gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex items-center gap-2">
                <Badge tone="neutral">Details</Badge>
                <strong>{t("digitalMoreSection")}</strong>
              </div>
              <div className="grid grid-cols-2 gap-3 max-[760px]:grid-cols-1">
                <TextField label="Address" value={form.address} onChange={(address) => setForm({ ...form, address })} />
                <TextField label={t("socialProfiles")} value={form.social_profiles} onChange={(social_profiles) => setForm({ ...form, social_profiles })} placeholder="LinkedIn, Facebook, GitHub" />
              </div>
              <TextField label={t("professionalBrief")} value={form.professional_brief} onChange={(professional_brief) => setForm({ ...form, professional_brief })} />
            </div>

            <div className="grid gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex items-center gap-2">
                <Badge tone="neutral">Highlights</Badge>
                <strong>{t("digitalHighlightSection")}</strong>
              </div>
              <TextField label="Highlights" value={form.highlights} onChange={(highlights) => setForm({ ...form, highlights })} placeholder="Founder, AI builder, Speaker" />
            </div>

            <Button variant="primary" type="submit" isLoading={busy === "digital-save"} startContent={<Save size={17} />}>{t("saveDigital")}</Button>
          </form>
        </Card.Content>
      </Card>

      <Card className="col-span-5 rounded-[2rem] max-[1050px]:col-span-12">
        <Card.Header>
          <div>
            <Card.Title>{t("publicPreview")}</Card.Title>
            <Card.Description>{shareUrl ? t("digitalDesc") : t("noPublicUrl")}</Card.Description>
          </div>
        </Card.Header>
        <Card.Content>
          <div className="grid min-h-[680px] content-start gap-5 rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_86%_8%,rgba(15,23,42,0.16),transparent_24%),linear-gradient(160deg,#fff,#f8fafc_52%,#e2e8f0)] p-7">
            <div className="flex items-center justify-between gap-3">
              {profilePhoto ? <img className="h-20 w-20 shrink-0 rounded-full border border-slate-200 object-cover object-center shadow-sm" src={profilePhoto} alt={displayName} /> : <Avatar value={displayName} />}
              <Badge tone="success">{t("publicPreview")}</Badge>
            </div>
            <h3 className="max-w-[13ch] text-6xl font-black leading-none tracking-normal text-slate-950 max-[760px]:text-4xl">{displayName}</h3>
            <p className="m-0 text-base font-bold leading-7 text-slate-600">{headline}</p>
            <small className="max-w-md text-sm leading-7 text-slate-500">{form.professional_brief || form.bio || t("shortBioPlaceholder")}</small>
            {!!highlightItems.length && (
              <div className="flex flex-wrap gap-2">
                {highlightItems.slice(0, 4).map((item) => <Badge key={item} tone="neutral">{item}</Badge>)}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {form.email && <span className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold"><Mail size={15} />Email</span>}
              {form.phone && <span className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold"><Phone size={15} />Phone</span>}
              {form.zalo && <span className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold">Zalo</span>}
              {form.linkedin && <span className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold">LinkedIn</span>}
              {form.address && <span className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold"><MapPin size={15} />Address</span>}
            </div>
            <div className="mt-auto rounded-[1.5rem] border border-slate-200 bg-white/80 p-4 shadow-sm">
              <div className="grid gap-3">
                <Button
                  variant="primary"
                  full
                  onPress={() => shareUrl && window.open(shareUrl, "_blank", "noopener,noreferrer")}
                  isDisabled={!shareUrl}
                  startContent={<Globe2 size={17} />}
                >
                  {t("openPublicCard")}
                </Button>
                <Button
                  variant="outline"
                  full
                  onPress={() => downloadQrImage(card?.qr_svg, accountSlug || displayName)}
                  isDisabled={!card?.qr_svg}
                  startContent={<Download size={17} />}
                >
                  {t("downloadQr")}
                </Button>
              </div>
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
      <main className="grid min-h-screen place-items-center bg-slate-100 p-6">
        <section className="grid justify-items-center gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 text-center shadow-xl">
          <BrandLogo />
          <span className="font-bold text-slate-600">{language === "vi" ? "Đang tải thẻ liên hệ..." : "Loading digital card..."}</span>
        </section>
      </main>
    );
  }
  if (card.error || card.detail) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 p-6">
        <section className="grid justify-items-center gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 text-center shadow-xl">
          <BrandLogo />
          <span className="font-bold text-slate-600">{card.error || card.detail}</span>
        </section>
      </main>
    );
  }
  const contactLinks = [
    card.phone && { label: "Phone", value: card.phone, href: `tel:${card.phone}`, icon: Phone },
    card.email && { label: "Email", value: card.email, href: `mailto:${card.email}`, icon: Mail },
    card.zalo && { label: "Zalo", value: card.zalo, href: asZaloUrl(card.zalo), icon: ContactRound },
    card.linkedin && { label: "LinkedIn", value: card.linkedin, href: asExternalUrl(card.linkedin), icon: Link },
    card.website && { label: "Website", value: card.website, href: asExternalUrl(card.website), icon: Globe2 },
    card.address && { label: "Address", value: card.address, href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(card.address)}`, icon: MapPin },
    ...(Array.isArray(card.social_profiles) ? card.social_profiles.map((profile, index) => ({
      label: `Social ${index + 1}`,
      value: profile,
      href: asExternalUrl(profile),
      icon: Link,
    })) : []),
  ].filter(Boolean);
  const headline = [card.title, card.company].filter(Boolean).join(" · ");
  const shareLabel = language === "vi" ? "Lưu liên hệ" : "Save contact";
  const primaryLinks = contactLinks.slice(0, 4);
  const secondaryLinks = contactLinks.slice(4, 8);
  const bioText = card.bio;
  const professionalBriefText = card.professional_brief;

  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f8fb] text-slate-950">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(180deg,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-[linear-gradient(120deg,rgba(14,165,233,0.18),rgba(255,255,255,0)_35%,rgba(16,185,129,0.14)_72%,rgba(255,255,255,0))]" />

      <section className="relative mx-auto grid min-h-screen w-[min(100%,1200px)] content-center gap-5 p-5">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-[2rem] border border-white/90 bg-white/76 px-5 py-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl max-[640px]:grid-cols-1">
          <div className="flex min-w-0 items-center gap-3">
            <BrandLogo className="size-12 rounded-2xl shadow-sm" />
            <div className="min-w-0">
              <strong className="block text-sm font-black text-slate-950">Cardly</strong>
              <span className="block truncate text-xs font-semibold text-slate-500">{language === "vi" ? "Thẻ liên hệ số được chia sẻ công khai" : "Public digital contact card"}</span>
            </div>
          </div>
          <span className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 text-xs font-black text-emerald-700">
            <BadgeCheck size={16} />
            {language === "vi" ? "Sẵn sàng kết nối" : "Ready to connect"}
          </span>
        </header>

        <div className="grid grid-cols-[minmax(0,1fr)_390px] gap-5 max-[980px]:grid-cols-1">
          <article className="relative overflow-hidden rounded-[2.7rem] border border-white bg-white shadow-[0_34px_120px_rgba(15,23,42,0.12)]">
            <div className="relative overflow-hidden bg-[linear-gradient(135deg,#0f172a,#172033_45%,#0f766e)] p-7 pb-10 text-white">
              <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.10)_0_1px,transparent_1px_22px)]" />
              <div className="relative flex items-start justify-between gap-4">
                <span className="rounded-full border border-white/18 bg-white/12 px-4 py-2 text-xs font-black uppercase tracking-normal text-white/82">
                  {language === "vi" ? "Digital pass" : "Digital pass"}
                </span>
                <QrCode className="text-white/70" size={28} />
              </div>
              <div className="relative mt-14 grid max-w-4xl gap-4">
                <h1 className="max-w-[13ch] text-7xl font-black leading-none tracking-normal text-white max-[760px]:text-5xl">{card.full_name}</h1>
                {headline && <p className="max-w-2xl text-xl font-bold leading-8 text-white/78">{headline}</p>}
              </div>
            </div>

            <div className="relative grid grid-cols-[176px_minmax(0,1fr)] gap-7 p-7 max-[760px]:grid-cols-1">
              <div className="grid content-start gap-4">
                <div className="grid size-44 place-items-center rounded-[2.3rem] border border-slate-200 bg-white p-1.5 shadow-[0_20px_56px_rgba(15,23,42,0.16)]">
                  {card.photo_url ? (
                    <img className="size-full rounded-[1.95rem] object-cover" src={card.photo_url} alt={card.full_name} />
                  ) : (
                    <span className="grid size-full place-items-center rounded-[1.95rem] bg-slate-950 text-5xl font-black text-white">{initials(card.full_name)}</span>
                  )}
                </div>
                {!!secondaryLinks.length && (
                  <div className="grid gap-2">
                    {secondaryLinks.map((link) => {
                      const Icon = link.icon;
                      const tone = contactIconTone(link.label);
                      return (
                        <a
                          className="inline-flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-700 no-underline transition hover:bg-white hover:text-slate-950"
                          key={link.label}
                          href={link.href}
                          target={link.href.startsWith("http") ? "_blank" : undefined}
                          rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                        >
                          <span className={`grid size-8 shrink-0 place-items-center rounded-xl ${tone}`}>
                            <Icon size={17} />
                          </span>
                          <span className="truncate">{link.label}</span>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="grid gap-5 pt-7">
                {bioText && (
                  <section className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5">
                    <span className="mb-2 block text-xs font-black uppercase tracking-normal text-slate-400">
                      Bio
                    </span>
                    <p className="m-0 text-base leading-8 text-slate-600">
                      {bioText}
                    </p>
                  </section>
                )}

                {!!card.highlights?.length && (
                  <div className="flex flex-wrap gap-2">
                    {card.highlights.slice(0, 6).map((item) => (
                      <span key={item} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm">{item}</span>
                    ))}
                  </div>
                )}

                <div className="grid gap-3">
                  {primaryLinks.map((link) => {
                const Icon = link.icon;
                const tone = contactIconTone(link.label);
                return (
                  <a
                    className="group grid min-h-[5.4rem] grid-cols-[52px_minmax(0,1fr)_28px] items-center gap-4 rounded-[1.7rem] border border-slate-200 bg-white p-4 text-slate-950 no-underline shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_50px_rgba(15,23,42,0.12)]"
                    key={link.label}
                    href={link.href}
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                    rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                  >
                    <span className={`grid size-12 place-items-center rounded-2xl ${tone}`}>
                      <Icon size={19} />
                    </span>
                    <span className="min-w-0">
                      <strong className="block text-sm font-black">{link.label}</strong>
                      <small className="mt-1 block truncate text-xs font-semibold text-slate-500">{link.value}</small>
                    </span>
                    <ChevronRight className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-950" size={20} />
                  </a>
                );
              })}
                </div>
              </div>
            </div>
          </article>

          <aside className="grid gap-5">
            <div className="rounded-[2.7rem] border border-white bg-white p-5 shadow-[0_34px_100px_rgba(15,23,42,0.12)]">
              <div className="rounded-[2.2rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="inline-flex min-h-9 items-center rounded-full bg-slate-100 px-4 text-xs font-black text-slate-700">QR</span>
                    <h2 className="mt-4 text-3xl font-black leading-none tracking-normal text-slate-950">{shareLabel}</h2>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                      {language === "vi" ? "Quét để mở lại hồ sơ hoặc lưu thông tin liên hệ." : "Scan to reopen this profile or save contact details."}
                    </p>
                  </div>
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-slate-950 text-white">
                    <QrCode size={24} />
                  </span>
                </div>
                <div className="mt-5 grid place-items-center rounded-[2rem] border border-slate-200 bg-white p-5 shadow-inner">
                  <QrImageWithLogo svg={card.qr_svg} className="size-60 rounded-[1.75rem] [&_svg]:size-52 max-[480px]:size-52 max-[480px]:[&_svg]:size-44" />
                </div>
                <button
                  className="mt-4 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-[0_16px_40px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  type="button"
                  disabled={!card.qr_svg}
                  onClick={() => downloadQrImage(card.qr_svg, card.slug || card.full_name || "cardly")}
                >
                  <Download size={17} />
                  {language === "vi" ? "Tải mã QR" : "Download QR"}
                </button>
              </div>
            </div>

            <div className="min-h-72 rounded-[2rem] border border-white bg-white/82 p-7 text-sm font-semibold leading-7 text-slate-500 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
              <strong className="block text-lg font-black text-slate-950">{language === "vi" ? "Tóm tắt" : "Professional brief"}</strong>
              <p className="mt-2 max-w-sm text-base font-bold leading-8 text-slate-500">
                {professionalBriefText || (language === "vi" ? "Một hồ sơ gọn để chia sẻ sau mỗi cuộc gặp." : "A polished profile for every new connection.")}
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function PublicContactPage({ contact, language }) {
  if (!contact) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 p-6">
        <section className="grid justify-items-center gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 text-center shadow-xl">
          <BrandLogo />
          <span className="font-bold text-slate-600">{language === "vi" ? "Đang tải liên hệ..." : "Loading contact..."}</span>
        </section>
      </main>
    );
  }
  if (contact.error || contact.detail) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 p-6">
        <section className="grid justify-items-center gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 text-center shadow-xl">
          <BrandLogo />
          <span className="font-bold text-slate-600">{contact.error || contact.detail}</span>
        </section>
      </main>
    );
  }

  const name = contact.name || (language === "vi" ? "Liên hệ Cardly" : "Cardly contact");
  const headline = [contact.position, contact.company].filter(Boolean).join(" · ");
  const links = [
    contact.phone && { label: "Phone", value: contact.phone, href: `tel:${contact.phone}`, icon: Phone },
    contact.email && { label: "Email", value: contact.email, href: `mailto:${contact.email}`, icon: Mail },
    contact.website && { label: "Website", value: contact.website, href: asExternalUrl(contact.website), icon: Globe2 },
    contact.address && { label: "Address", value: contact.address, href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`, icon: MapPin },
  ].filter(Boolean);

  return (
    <main className="min-h-screen bg-[#f6f8fb] p-5 text-slate-950">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(180deg,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <section className="relative mx-auto grid min-h-[calc(100vh-2.5rem)] w-[min(100%,980px)] content-center gap-5">
        <article className="overflow-hidden rounded-[2.7rem] border border-white bg-white shadow-[0_34px_120px_rgba(15,23,42,0.12)]">
          <div className="bg-[linear-gradient(135deg,#0f172a,#164e63_58%,#0f766e)] p-7 text-white">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <BrandLogo className="size-12 rounded-2xl" />
                <span>
                  <strong className="block text-sm font-black">Cardly</strong>
                  <small className="text-white/62">{language === "vi" ? "Liên hệ được chia sẻ" : "Shared contact"}</small>
                </span>
              </div>
              <BadgeCheck size={24} />
            </div>
            <h1 className="mt-14 max-w-[13ch] text-7xl font-black leading-none tracking-normal max-[760px]:text-5xl">{name}</h1>
            {headline && <p className="mt-4 text-xl font-bold text-white/78">{headline}</p>}
          </div>
          <div className="grid gap-5 p-7">
            {contact.professional_brief && (
              <p className="m-0 rounded-[2rem] border border-slate-200 bg-slate-50 p-5 text-base leading-8 text-slate-600">{contact.professional_brief}</p>
            )}
            {!!contact.highlights?.length && (
              <div className="flex flex-wrap gap-2">
                {contact.highlights.slice(0, 6).map((item) => <Badge key={item} tone="neutral">{item}</Badge>)}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 max-[760px]:grid-cols-1">
              {links.map((link) => {
                const Icon = link.icon;
                const tone = contactIconTone(link.label);
                return (
                  <a key={link.label} className="grid min-h-20 grid-cols-[48px_minmax(0,1fr)] items-center gap-3 rounded-[1.5rem] border border-slate-200 bg-white p-4 text-slate-950 no-underline shadow-sm" href={link.href} target={link.href.startsWith("http") ? "_blank" : undefined} rel={link.href.startsWith("http") ? "noreferrer" : undefined}>
                    <span className={`grid size-12 place-items-center rounded-2xl ${tone}`}><Icon size={18} /></span>
                    <span className="min-w-0">
                      <strong className="block text-sm font-black">{link.label}</strong>
                      <small className="mt-1 block truncate text-xs font-semibold text-slate-500">{link.value}</small>
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}

function PublicBundlePage({ bundle, language }) {
  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.assign("/contacts");
  };

  if (!bundle) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 p-6">
        <section className="grid justify-items-center gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 text-center shadow-xl">
          <BrandLogo />
          <span className="font-bold text-slate-600">{language === "vi" ? "Đang tải gói liên hệ..." : "Loading contact bundle..."}</span>
        </section>
      </main>
    );
  }
  if (bundle.error || bundle.detail) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 p-6">
        <section className="grid justify-items-center gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 text-center shadow-xl">
          <BrandLogo />
          <span className="font-bold text-slate-600">{bundle.error || bundle.detail}</span>
        </section>
      </main>
    );
  }

  const contacts = bundle.contacts || [];
  return (
    <main className="min-h-screen bg-[#f6f8fb] p-5 text-slate-950">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(180deg,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <section className="relative mx-auto grid w-[min(100%,1100px)] gap-5 py-8">
        <header className="rounded-[2.7rem] border border-white bg-white/84 p-7 shadow-[0_28px_90px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <BrandLogo className="size-12 rounded-2xl" />
              <span>
                <strong className="block text-sm font-black">Cardly</strong>
                <small className="font-semibold text-slate-500">{language === "vi" ? "Gói liên hệ được chia sẻ" : "Shared contact bundle"}</small>
              </span>
            </div>
            <Button variant="outline" onPress={goBack} startContent={<ArrowLeft size={17} />}>
              {language === "vi" ? "Quay về" : "Back"}
            </Button>
          </div>
          <h1 className="mt-8 max-w-3xl text-5xl font-black leading-none tracking-normal max-[760px]:text-4xl">
            {language === "vi" ? `${contacts.length} liên hệ trong một QR` : `${contacts.length} contacts in one QR`}
          </h1>
        </header>
        <div className="grid gap-3">
          {contacts.map((contact) => (
            <article key={contact.id} className="grid grid-cols-[56px_minmax(0,1fr)] gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
              <Avatar value={contact.name || contact.company || "C"} />
              <div className="min-w-0">
                <h2 className="truncate text-xl font-black">{contact.name || (language === "vi" ? "Chưa có tên" : "Unnamed contact")}</h2>
                <p className="mt-1 truncate text-sm font-semibold text-slate-500">{[contact.position, contact.company].filter(Boolean).join(" · ") || "-"}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
                  {contact.email && <span className="rounded-full bg-slate-100 px-3 py-1">{contact.email}</span>}
                  {contact.phone && <span className="rounded-full bg-slate-100 px-3 py-1">{contact.phone}</span>}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function digitalCardForm(card, user) {
  return {
    slug: emailSlug(user?.email || card?.email || card?.slug || "cardly"),
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
    address: card?.address || "",
    social_profiles: Array.isArray(card?.social_profiles) ? card.social_profiles.join(", ") : "",
    professional_brief: card?.professional_brief || "",
    keywords: Array.isArray(card?.keywords) ? card.keywords.join(", ") : "",
    tags: Array.isArray(card?.tags) ? card.tags.join(", ") : "",
    notes: card?.notes || "",
    highlights: Array.isArray(card?.highlights) ? card.highlights.join(", ") : "",
    is_public: card?.is_public ?? true,
  };
}

function emailSlug(email) {
  const localPart = String(email || "").split("@")[0];
  return slugify(localPart || email || "cardly");
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
    || path === "/register"
    || path === "/verify-otp"
    || path === "/contacts"
    || path === "/contacts/new"
    || path === "/contacts/qr"
    || path === "/ocr"
    || path === "/digital"
    || path.startsWith("/contacts/")
    || path.startsWith("/card/")
    || path.startsWith("/contact/")
    || path.startsWith("/bundle/")
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
  if (path === "/contacts/qr") return { view: "qr-contact" };
  if (path.startsWith("/contacts/")) {
    return { view: "contact-detail", contactId: decodeURIComponent(path.replace("/contacts/", "")) };
  }
  if (path === "/ocr") return { view: "ocr" };
  if (path === "/digital") return { view: "digital" };
  return { view: "contacts" };
}

function pathForView(view, contactId = "") {
  if (view === "manual") return "/contacts/new";
  if (view === "qr-contact") return "/contacts/qr";
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

function contactToForm(contact = {}) {
  return {
    name: contact.name || "",
    company: contact.company || "",
    position: contact.position || "",
    email: contact.email || "",
    phone: contact.phone || "",
    website: contact.website || "",
    address: contact.address || "",
    professional_brief: contact.professional_brief || "",
    event_name: contact.event_name || "",
    location: contact.location || "",
    source: contact.source || "Manual",
    tags: normalizeList(contact.tags).join(", "),
    notes: contact.notes || "",
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
    zalo: normalizeZaloPhone(data.zalo),
    social_profiles: splitList(data.social_profiles),
    keywords: splitList(data.keywords),
    tags: splitList(data.tags),
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

async function downloadQrImage(svg, fileName = "cardly-qr") {
  if (!svg || typeof document === "undefined") return false;
  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);
  const image = new Image();
  image.decoding = "async";
  image.src = svgUrl;
  await image.decode();

  const canvas = document.createElement("canvas");
  const size = 1024;
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, size, size);
  context.drawImage(image, 96, 96, size - 192, size - 192);
  URL.revokeObjectURL(svgUrl);

  try {
    const logo = new Image();
    logo.crossOrigin = "anonymous";
    logo.decoding = "async";
    logo.src = BRAND_LOGO_URL;
    await logo.decode();
    const logoBox = 136;
    const logoSize = 96;
    const logoBoxPosition = (size - logoBox) / 2;
    const logoPosition = (size - logoSize) / 2;
    context.fillStyle = "#ffffff";
    context.beginPath();
    context.roundRect(logoBoxPosition, logoBoxPosition, logoBox, logoBox, 28);
    context.fill();
    context.drawImage(logo, logoPosition, logoPosition, logoSize, logoSize);
  } catch {
    // If the logo cannot be loaded, still export a clean QR image.
  }

  const pngBlob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!pngBlob) return false;
  const pngUrl = URL.createObjectURL(pngBlob);
  const link = document.createElement("a");
  link.href = pngUrl;
  link.download = `${slugify(fileName)}-qr.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(pngUrl);
  return true;
}

async function downloadGeneratedQrImage(value, fileName = "cardly-contact") {
  const text = String(value || "").trim();
  if (!text || typeof document === "undefined") return false;

  const canvas = document.createElement("canvas");
  const size = 1024;
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, size, size);

  const qr = new Image();
  qr.crossOrigin = "anonymous";
  qr.decoding = "async";
  qr.src = qrImageSource(text);
  await qr.decode();
  context.drawImage(qr, 96, 96, size - 192, size - 192);

  try {
    const logo = new Image();
    logo.crossOrigin = "anonymous";
    logo.decoding = "async";
    logo.src = BRAND_LOGO_URL;
    await logo.decode();
    const logoBox = 136;
    const logoSize = 96;
    const logoBoxPosition = (size - logoBox) / 2;
    const logoPosition = (size - logoSize) / 2;
    context.fillStyle = "#ffffff";
    context.beginPath();
    context.roundRect(logoBoxPosition, logoBoxPosition, logoBox, logoBox, 28);
    context.fill();
    context.drawImage(logo, logoPosition, logoPosition, logoSize, logoSize);
  } catch {
    // Keep the QR downloadable even if the logo image is temporarily unavailable.
  }

  const pngBlob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!pngBlob) return false;
  const pngUrl = URL.createObjectURL(pngBlob);
  const link = document.createElement("a");
  link.href = pngUrl;
  link.download = `${slugify(fileName)}-qr.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(pngUrl);
  return true;
}

function Card({ children, className = "" }) {
  return (
    <HeroCard className={`overflow-hidden border border-slate-200/80 bg-white/85 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl ${className}`}>
      {children}
    </HeroCard>
  );
}

Card.Header = function CardHeader({ children }) {
  return (
    <HeroCard.Header className="flex min-h-20 items-center justify-between gap-4 border-b border-slate-200/70 bg-gradient-to-b from-white/90 to-slate-50/70 px-5 py-4">
      {children}
    </HeroCard.Header>
  );
};

Card.Title = function CardTitle({ children }) {
  return <HeroCard.Title className="text-base font-semibold tracking-normal text-slate-950">{children}</HeroCard.Title>;
};

Card.Description = function CardDescription({ children }) {
  return <HeroCard.Description className="mt-1 text-sm leading-6 text-slate-500">{children}</HeroCard.Description>;
};

Card.Content = function CardContent({ children, className = "" }) {
  return <HeroCard.Content className={`p-5 ${className}`}>{children}</HeroCard.Content>;
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
    <HeroButton
      type={type}
      variant={variant}
      className={`${full ? "w-full" : ""} min-h-11 min-w-0 rounded-2xl px-4 font-semibold`}
      isDisabled={isDisabled}
      isLoading={isLoading}
      onPress={onPress}
    >
      {!isLoading && startContent}
      {children}
    </HeroButton>
  );
}

function QrImageWithLogo({ svg, className = "" }) {
  return (
    <div className={`relative grid place-items-center border border-slate-200 bg-white shadow-sm ${className}`}>
      <div className="grid place-items-center" dangerouslySetInnerHTML={{ __html: svg || "" }} />
      {svg && (
        <span className="absolute left-1/2 top-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl bg-white p-1.5 shadow-[0_8px_22px_rgba(15,23,42,0.18)]">
          <img className="size-full rounded-xl object-contain" src={BRAND_LOGO_URL} alt="Cardly" />
        </span>
      )}
    </div>
  );
}

function GeneratedQrWithLogo({ value, className = "", imageClassName = "size-32", logoClassName = "size-10 rounded-xl p-1" }) {
  return (
    <div className={`relative grid place-items-center border border-slate-100 bg-white p-2 shadow-sm ${className}`}>
      <img className={`${imageClassName} object-contain`} src={qrImageSource(value)} alt="QR code" loading="lazy" />
      <span className={`absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center bg-white shadow-[0_8px_22px_rgba(15,23,42,0.18)] ${logoClassName}`}>
        <img className="size-full rounded-[inherit] object-contain" src={BRAND_LOGO_URL} alt="Cardly" />
      </span>
    </div>
  );
}

function PasswordVisibilityButton({ isVisible, onToggle }) {
  return (
    <button
      type="button"
      className="grid size-8 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-950"
      onClick={onToggle}
      aria-label={isVisible ? "Hide password" : "Show password"}
      title={isVisible ? "Hide password" : "Show password"}
    >
      {isVisible ? <EyeOff size={17} /> : <Eye size={17} />}
    </button>
  );
}

function TextField({ label, value, onChange = () => {}, icon, type = "text", placeholder = "", maxLength, required = false, readOnly = false, endContent = null }) {
  return (
    <label className="grid w-full gap-2 text-sm font-semibold text-slate-500">
      <span>{label}</span>
      <div className={`flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 px-3 shadow-sm transition focus-within:border-slate-900 focus-within:ring-4 focus-within:ring-slate-900/10 ${readOnly ? "bg-slate-50" : "bg-white/85"}`}>
        {icon}
        <input
          className="w-full min-w-0 bg-transparent text-slate-950 outline-none placeholder:text-slate-400"
          type={type}
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          readOnly={readOnly}
          onChange={(event) => onChange(event.target.value)}
          required={required}
        />
        {endContent}
      </div>
    </label>
  );
}

function Tabs({ value, onValueChange, items }) {
  return (
    <div className="my-4 grid gap-1 rounded-2xl border border-slate-200 bg-slate-100 p-1" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          className={`min-h-10 rounded-xl text-sm font-bold transition ${value === item.key ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-950"}`}
          onClick={() => onValueChange(item.key)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function Badge({ children, tone = "neutral" }) {
  const color = tone === "success" ? "success" : tone === "danger" ? "danger" : tone === "warning" ? "warning" : "default";
  return <HeroChip color={color} className="rounded-full px-3 py-1 text-xs font-semibold">{children}</HeroChip>;
}

function LanguageSwitcher({ language, onChange }) {
  return (
    <div className="inline-flex min-h-10 items-center gap-1 rounded-full border border-slate-200 bg-white/85 px-2 text-slate-500 shadow-sm" aria-label="Language">
      <Languages size={16} />
      <button type="button" className={`grid h-8 min-w-9 place-items-center rounded-full text-xs font-black ${language === "vi" ? "bg-slate-950 text-white" : "text-slate-600"}`} onClick={() => onChange("vi")}>VI</button>
      <button type="button" className={`grid h-8 min-w-9 place-items-center rounded-full text-xs font-black ${language === "en" ? "bg-slate-950 text-white" : "text-slate-600"}`} onClick={() => onChange("en")}>EN</button>
    </div>
  );
}

function FilePicker({ label, chooseLabel = "Choose image", file, onChange }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-500">
      <span>{label}</span>
      <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => onChange(event.target.files?.[0] || null)} />
      <strong className="flex min-h-32 items-end justify-start rounded-[1.5rem] border border-dashed border-slate-300 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(248,250,252,0.94)),repeating-linear-gradient(135deg,rgba(15,23,42,0.045)_0_1px,transparent_1px_16px)] p-5 text-slate-950 shadow-sm">
        {file?.name || chooseLabel}
      </strong>
    </label>
  );
}

function Toolbar({ children }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-slate-50/80 p-3">{children}</div>;
}

function EmptyState({ icon, title, description }) {
  return (
    <div className="grid min-h-60 place-items-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 p-8 text-center text-slate-500">
      <div className="grid justify-items-center gap-3">
        <span className="grid size-12 place-items-center rounded-2xl bg-white text-slate-700 shadow-sm">{icon}</span>
        <strong className="text-base text-slate-950">{title}</strong>
        <p className="max-w-md text-sm leading-6">{description}</p>
      </div>
    </div>
  );
}

function Avatar({ value = "", src = "" }) {
  if (src) {
    return <img className="size-11 shrink-0 rounded-full border border-slate-200 object-cover shadow-sm" src={src} alt={value || "Avatar"} />;
  }
  return <span className="grid size-11 shrink-0 place-items-center rounded-full bg-slate-950 text-sm font-black text-white shadow-sm">{initials(value)}</span>;
}

function Stat({ label, value }) {
  return (
    <div className="grid gap-1 rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      <strong className="text-xl font-bold text-slate-950">{value}</strong>
      <span className="text-xs font-semibold text-slate-500">{label}</span>
    </div>
  );
}

function Toast({ toast }) {
  return (
    <div className={`fixed bottom-5 right-5 z-50 max-w-md rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-2xl ${toast.type === "error" ? "bg-red-600" : "bg-slate-950"}`}>
      {toast.message}
    </div>
  );
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
    return "Access your contacts and card scanning workspace.";
  }
  if (view === "register") return "Tạo tài khoản và nhận mã OTP qua email.";
  if (view === "otp") return "Nhập mã 6 chữ số để kích hoạt tài khoản.";
  return "Truy cập danh bạ và khu vực quét danh thiếp của bạn.";
}

function pageInstructions(view, language) {
  const vi = language === "vi";
  const content = {
    contacts: {
      icon: ContactRound,
      tone: "from-sky-50 via-white to-emerald-50",
      title: vi ? "Quản lý danh bạ" : "Manage contacts",
      description: vi
        ? "Đây là nơi xem toàn bộ liên hệ đã lưu, tìm kiếm nhanh, mở chi tiết và tạo QR bundle để chia sẻ nhiều contact cùng lúc."
        : "This is where saved contacts live. Search quickly, open contact details and create QR bundles to share many contacts at once.",
      items: vi
        ? [
            [Search, "Tìm liên hệ", "Dùng ô tìm kiếm để lọc theo tên, công ty, email hoặc số điện thoại."],
            [Eye, "Mở chi tiết", "Bấm vào thẻ liên hệ để xem thông tin đầy đủ, ảnh danh thiếp và QR contact."],
            [QrCode, "Tạo QR bundle", "Chọn từ hai liên hệ trở lên rồi bấm Chia sẻ đã chọn để tạo QR chung."],
            [Trash2, "Xóa cẩn thận", "Các hành động xóa sẽ có hộp xác nhận trước khi dữ liệu bị gỡ khỏi danh bạ."],
          ]
        : [
            [Search, "Find contacts", "Use search to filter by name, company, email or phone number."],
            [Eye, "Open details", "Open a contact to inspect full details, card images and contact QR."],
            [QrCode, "Create QR bundles", "Select two or more contacts, then share them through one bundle QR."],
            [Trash2, "Delete carefully", "Delete actions ask for confirmation before removing records."],
          ],
    },
    "qr-contact": {
      icon: QrCode,
      tone: "from-amber-50 via-white to-sky-50",
      title: vi ? "Thêm liên hệ bằng QR" : "Add contacts by QR",
      description: vi
        ? "Trang này dùng để upload ảnh QR từ Cardly. QR có thể là thẻ số cá nhân, một contact riêng lẻ hoặc bundle nhiều contact."
        : "Use this page to upload a Cardly QR image. It can point to a digital card, one shared contact or a multi-contact bundle.",
      items: vi
        ? [
            [Upload, "Chọn ảnh QR", "Upload ảnh QR rõ nét, ít bị cắt góc và đủ sáng để hệ thống đọc được link."],
            [QrCode, "Nhận diện link", "Hệ thống đọc link Cardly trong QR rồi xác định đó là card, contact hay bundle."],
            [ContactRound, "Lưu vào danh bạ", "Nếu QR hợp lệ, liên hệ sẽ được tạo trong danh bạ của tài khoản hiện tại."],
            [Layers, "Hỗ trợ bundle", "Với QR bundle, hệ thống có thể lưu nhiều liên hệ trong cùng một lần quét."],
          ]
        : [
            [Upload, "Choose QR image", "Upload a clear QR image with enough contrast and visible corners."],
            [QrCode, "Read the link", "Cardly reads the QR link and detects whether it is a card, contact or bundle."],
            [ContactRound, "Save contacts", "Valid QR data is saved into the current account's address book."],
            [Layers, "Bundle support", "A bundle QR can save multiple contacts from one scan."],
          ],
    },
    ocr: {
      icon: FileText,
      tone: "from-emerald-50 via-white to-fuchsia-50",
      title: vi ? "Quét danh thiếp" : "Scan business cards",
      description: vi
        ? "Trang quét danh thiếp tách luồng thành từng bước: upload ảnh, chọn bản scan trong hàng đợi, đọc thông tin, review dữ liệu rồi lưu vào danh bạ."
        : "The card scanning page is split into steps: upload images, pick a queued scan, read details, review data and save the contact.",
      items: vi
        ? [
            [CloudUpload, "Upload ảnh", "Có thể upload mặt trước và mặt sau. Ảnh gốc được lưu để bạn xem lại."],
            [Layers, "Chọn từ hàng đợi", "Những bản scan chưa lưu contact sẽ nằm trong hàng đợi để tiếp tục xử lý."],
            [FileText, "Đọc danh thiếp", "Khi bấm đọc danh thiếp, thanh tiến trình cho biết hệ thống đang đọc và chuẩn bị dữ liệu."],
            [Save, "Review rồi lưu", "Chỉnh dữ liệu trong panel kết quả; bấm Lưu vào danh bạ để lưu bản chỉnh sửa cuối cùng."],
          ]
        : [
            [CloudUpload, "Upload images", "Upload front and back images. Original files remain available for review."],
            [Layers, "Pick from queue", "Unsaved scans stay in the queue so you can continue later."],
            [FileText, "Read card", "The progress bar shows when Cardly is reading and preparing extracted data."],
            [Save, "Review and save", "Edit the result panel, then save the final version into contacts."],
          ],
    },
    digital: {
      icon: Globe2,
      tone: "from-fuchsia-50 via-white to-indigo-50",
      title: vi ? "Thiết lập thẻ số" : "Set up digital card",
      description: vi
        ? "Thẻ số là hồ sơ công khai của bạn. Bạn có thể cập nhật thông tin, dùng avatar tài khoản, xem preview và tải QR để chia sẻ."
        : "Your digital card is a public profile. Update details, use your account avatar, preview the card and download the QR for sharing.",
      items: vi
        ? [
            [Pencil, "Cập nhật hồ sơ", "Điền họ tên, chức vụ, công ty, bio và các kênh liên hệ quan trọng."],
            [Upload, "Đổi avatar", "Avatar tài khoản sẽ được dùng làm ảnh đại diện trên thẻ số công khai."],
            [Eye, "Xem preview", "Khung bên phải hiển thị gần giống trang /card mà người khác sẽ nhìn thấy."],
            [Download, "Tải QR", "Sau khi lưu thẻ số, tải QR dạng ảnh để in, gửi hoặc đưa cho người khác quét."],
          ]
        : [
            [Pencil, "Update profile", "Fill in name, position, company, bio and key contact channels."],
            [Upload, "Change avatar", "Your account avatar is used as the public digital-card photo."],
            [Eye, "Preview card", "The preview shows roughly what other people see on your /card page."],
            [Download, "Download QR", "After saving, download the QR image to print, send or share in person."],
          ],
    },
  };
  return content[view] || null;
}

function viewTitle(view, t) {
  if (view === "contact-detail") return t("viewDetail");
  if (view === "manual") return t("viewManual");
  if (view === "qr-contact") return t("navQrContact");
  if (view === "ocr") return t("viewOcr");
  if (view === "digital") return t("viewDigital");
  return t("viewContacts");
}

function viewEyebrow(view, t) {
  if (view === "contact-detail") return t("eyebrowDetail");
  if (view === "manual") return t("eyebrowManual");
  if (view === "qr-contact") return t("navQrContact");
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
  return ["confirmed"].includes(doc.status);
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
