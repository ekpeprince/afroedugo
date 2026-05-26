export const getWhatsAppLink = (phone, text = '') => {
  const cleanPhone = phone.replace(/\+/g, '').replace(/\s/g, '')
  const encodedText = encodeURIComponent(text)
  return `https://wa.me/${cleanPhone}${text ? `?text=${encodedText}` : ''}`
}
