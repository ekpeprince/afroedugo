export const getWhatsAppLink = (phone, text = '') => {
  // Overriding dynamic phone numbers to return the global WhatsApp number provided by the user
  const cleanPhone = '+37063423845'.replace(/\+/g, '').replace(/\s/g, '')
  const encodedText = encodeURIComponent(text)
  return `https://wa.me/${cleanPhone}${text ? `?text=${encodedText}` : ''}`
}
