const API_URL = import.meta.env.VITE_API_URL
export async function getMe(fetchWithAuth){
    let res

    try{
        res = await fetchWithAuth(`${API_URL}/users/me`)

    }catch{
        throw new Error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.')
    }
    const data = await res.json().catch(() => null)
    if (!res.ok) throw new Error(data?.message ?? 'Không lấy được thông tin tài khoản.')

    return data
}

// Sửa họ tên, số điện thoại của người đang đăng nhập. Backend trả về MeResponse mới để cập nhật lại user
export async function updateMe(fetchWithAuth, { fullName, phone }) {
    let res

    try {
        res = await fetchWithAuth(`${API_URL}/users/me`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName, phone: phone || null }),
        })
    } catch {
        throw new Error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.')
    }
    const data = await res.json().catch(() => null)
    if (!res.ok) throw new Error(data?.message ?? 'Cập nhật chưa thành công. Vui lòng thử lại.')

    return data
}
