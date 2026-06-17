/**
 * SHA-256 hash a password string using the Web Crypto API.
 * Used on the frontend before sending passwords to the server,
 * so plain-text passwords never travel over the wire.
 */
const hashPassword = async (pwd) => {
  const utf8       = new TextEncoder().encode(pwd)
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', utf8)
  const hashArray  = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export default hashPassword
