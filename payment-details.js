// Admin's receiving payment details for BUY orders.
// Edit ETB with your real CBE/Telebirr info. Other currencies fall back to chat.
const ADMIN_PAYMENT_DETAILS = {
  ETB: {
    CBE: {
      Bank: "Commercial Bank of Ethiopia",
      "Account Name": "Your Full Name",
      "Account Number": "1000XXXXXXXXX",
    },
    Telebirr: {
      "Account Name": "Your Full Name",
      "Phone Number": "+2519XXXXXXXX",
    },
  },
};

function getPaymentDetails(currency, method) {
  if (
    ADMIN_PAYMENT_DETAILS[currency] &&
    ADMIN_PAYMENT_DETAILS[currency][method]
  ) {
    return ADMIN_PAYMENT_DETAILS[currency][method];
  }
  return null;
}
