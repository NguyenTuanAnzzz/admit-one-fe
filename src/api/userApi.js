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