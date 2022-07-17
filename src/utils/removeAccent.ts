export const removeAccent = (s: string) => {
   s = s.replace(/[aàáảạãăắằặẵặâấậẩầẫ]/g, "a")
   s = s.replace(/[đ]/g, "d")
   s = s.replace(/[eèéẻẹẽêểếệềễ]/g, "e")
   s = s.replace(/[iìíỉịĩ]/g, "i")
   s = s.replace(/[oòóỏọõôổốồộỗơớờởợỡ]/g, "o")
   s = s.replace(/[uùúủụũưừứửựữ]/g, "u")
   s = s.replace(/[yýỳỷỵỹ]/g, "y")
   s = s.replace(/[,.?!@#$%^&*]/g, "")
   s = s.replace(/[\s]/g, "-")
   return s
}
