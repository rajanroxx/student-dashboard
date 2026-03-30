export const formatDate = (dateString) => {
    // Backend now sends dates already in dd-mm-yyyy format
    if (!dateString) return '';
    
    try {
      // If already in dd-mm-yyyy format, return as is
      if (typeof dateString === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(dateString.trim())) {
        return dateString.trim();
      }
      
      return String(dateString).trim();
    } catch {
      return String(dateString).trim();
    }
  };
  