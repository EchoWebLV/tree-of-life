export const getClientToken = (): string => {
  // Check if token exists in localStorage
  let token = localStorage.getItem('clientToken');
  
  // If no token exists, create one and store it
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem('clientToken', token);
  }
  
  return token;
}; 