export const DAILY_MESSAGE_LIMIT = 200;

interface MessageCount {
  count: number;
  date: string;
}

export const getMessageCount = (): MessageCount => {
  const today = new Date().toDateString();
  const stored = localStorage.getItem('messageCount');
  
  if (!stored) {
    return { count: 0, date: today };
  }

  const data: MessageCount = JSON.parse(stored);
  
  // Reset count if it's a new day
  if (data.date !== today) {
    return { count: 0, date: today };
  }
  
  return data;
};

export const incrementMessageCount = (): boolean => {
  const today = new Date().toDateString();
  const currentCount = getMessageCount();
  
  // Reset if it's a new day
  if (currentCount.date !== today) {
    const newCount = { count: 1, date: today };
    localStorage.setItem('messageCount', JSON.stringify(newCount));
    return true;
  }
  
  // Check if limit reached
  if (currentCount.count >= DAILY_MESSAGE_LIMIT) {
    return false;
  }
  
  // Increment count
  const newCount = { count: currentCount.count + 1, date: today };
  localStorage.setItem('messageCount', JSON.stringify(newCount));
  return true;
}; 