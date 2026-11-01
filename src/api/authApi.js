// Đổi địa chỉ backend trong file .env (VITE_API_URL), đã gồm /api ở cuối
const API_URL = import.meta.env.VITE_API_URL

export async function register({ fullName, email, phone, password }) {
  let res
  try {
    res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, phone: phone || null, password }),
    })
  } catch {
    throw new Error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.')
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.message ?? 'Đăng ký chưa thành công. Vui lòng thử lại.')
  return data
}

export async function verifyEmail({ email, code }) {
  let res
  try {
    res = await fetch(`${API_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    })
  } catch {
    throw new Error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.')
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.message ?? 'Xác minh chưa thành công. Vui lòng thử lại.')
  return data
}

export async function resendOtp({ email }) {
  let res
  try {
    res = await fetch(`${API_URL}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
  } catch {
    throw new Error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.')
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.message ?? 'Gửi lại mã chưa thành công. Vui lòng thử lại.')
  return data
}

export async function login({ email, password, rememberMe }) {
  let res
  try {
    res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Cho trình duyệt nhận cookie refreshToken backend đặt khi đăng nhập
      credentials: 'include',
      body: JSON.stringify({ email, password, rememberMe }),
    })
  } catch {
    throw new Error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.')
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.message ?? 'Đăng nhập chưa thành công. Vui lòng thử lại.')
  return data
}

// Đổi cookie refreshToken (httpOnly) lấy access token mới. Không có cookie hoặc hết hạn thì ném lỗi.
export async function refresh() {
  let res
  try {
    res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
  } catch {
    throw new Error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.')
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.message ?? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
  return data
}

export async function logout() {
  let res
  try {
    res = await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    })
  } catch {
    throw new Error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.')
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.message ?? 'Đăng xuất chưa thành công.')
  return data
}
