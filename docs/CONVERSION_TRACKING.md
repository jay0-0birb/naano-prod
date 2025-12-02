# 🎯 Conversion Tracking Documentation

## Overview

Naano's conversion tracking system allows SaaS companies to attribute revenue to specific creators using a 30-day cookie attribution model.

**Two integration methods:**
1. **JavaScript Pixel** (Easy - Copy/Paste)
2. **Server Webhook** (Accurate - 99% tracking)

---

## Method 1: JavaScript Pixel (Recommended for Most)

### Setup

Add this script to your **thank-you page** or **order confirmation page**:

```html
<script>
  // After successful purchase/signup
  fetch('https://naano.com/api/track/conversion', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important: Sends cookies
    body: JSON.stringify({
      revenue: 99.00,        // Required: Amount in EUR
      order_id: 'order-123', // Optional: Your order ID
      customer_email: 'user@example.com' // Optional
    })
  })
  .then(response => response.json())
  .then(data => console.log('Conversion tracked:', data))
  .catch(error => console.error('Tracking error:', error));
</script>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `revenue` | number | ✅ Yes | Revenue amount in EUR (e.g., 99.00) |
| `order_id` | string | ❌ No | Your internal order/transaction ID |
| `customer_email` | string | ❌ No | Customer email for reference |

### Pros & Cons

✅ **Pros:**
- Super easy to implement (copy/paste)
- Works on any platform (Shopify, WordPress, custom)
- No backend code needed
- No API key required

❌ **Cons:**
- ~75% accuracy (ad blockers can block it)
- Requires customer to stay on page until script loads
- Cookie must be accessible (same-domain issues possible)

---

## Method 2: Server Webhook (Recommended for Accuracy)

### Setup

Call our API from your **backend** after a successful purchase:

```javascript
// Node.js example
const response = await fetch('https://naano.com/api/track/conversion', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY_HERE' // Get from Naano dashboard
  },
  body: JSON.stringify({
    session_id: 'uuid-from-cookie',  // Read from naano_attribution cookie
    revenue: 99.00,
    order_id: 'order-123',
    customer_email: 'user@example.com'
  })
});

const data = await response.json();
console.log('Conversion tracked:', data);
```

### Getting the Session ID

The `session_id` comes from the `naano_attribution` cookie that was set when the user clicked the tracking link.

**Example (Node.js/Express):**
```javascript
app.post('/checkout/success', (req, res) => {
  const sessionId = req.cookies.naano_attribution;
  
  if (sessionId) {
    // Send to Naano
    trackConversion(sessionId, orderAmount);
  }
  
  res.render('thank-you');
});
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session_id` | string | ✅ Yes | Value from `naano_attribution` cookie |
| `revenue` | number | ✅ Yes | Revenue amount in EUR |
| `order_id` | string | ❌ No | Your internal order ID |
| `customer_email` | string | ❌ No | Customer email |

### Authentication

Include your API key in the `Authorization` header:
```
Authorization: Bearer sk_live_abc123...
```

**Get your API key:**
1. Login to Naano dashboard
2. Go to Settings → API Keys
3. Click "Generate API Key"
4. Copy and store securely (never expose in frontend!)

### Pros & Cons

✅ **Pros:**
- 99% accuracy (no ad blockers)
- More secure (API key authentication)
- Guaranteed delivery (can retry if fails)
- Works even if user closes browser

❌ **Cons:**
- Requires backend code
- More complex to implement
- Need to handle cookie reading server-side

---

## Response Format

### Success Response (200)

```json
{
  "success": true,
  "message": "Conversion tracked successfully",
  "conversion_id": "uuid-123",
  "method": "pixel" // or "webhook"
}
```

### Error Responses

**400 - Invalid Request**
```json
{
  "error": "Invalid revenue amount"
}
```

**401 - Unauthorized (Webhook only)**
```json
{
  "error": "Invalid API key"
}
```

**404 - No Tracking Link Found**
```json
{
  "error": "No tracking link found for this session"
}
```

**Already Tracked (200)**
```json
{
  "success": true,
  "message": "Conversion already recorded",
  "conversion_id": "uuid-123"
}
```

---

## Testing

### Test with Pixel

1. Click a tracking link from Naano
2. Go to your checkout page
3. Complete a test purchase
4. Check browser console for "Conversion tracked" message
5. Verify in Naano dashboard that revenue appears

### Test with Webhook

Use curl to test:

```bash
curl -X POST https://naano.com/api/track/conversion \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "session_id": "test-session-123",
    "revenue": 99.00,
    "order_id": "test-order-123"
  }'
```

---

## FAQ

### Q: Can I use both methods?
**A:** Yes! You can use pixel as fallback and webhook as primary. The system prevents double-counting.

### Q: What if the cookie expired?
**A:** Conversions only work within 30 days of the initial click. After that, the cookie expires and conversions won't be attributed.

### Q: Can I track multiple conversions per user?
**A:** No, only the first conversion is tracked to prevent double-counting. Subsequent conversions from the same session are ignored.

### Q: What about GDPR compliance?
**A:** The tracking cookie is functional (not marketing) and required for attribution. Include it in your cookie policy.

### Q: Does it work across subdomains?
**A:** Yes, if your main site is `example.com` and checkout is `checkout.example.com`, cookies work across both.

### Q: What if my SaaS uses a payment provider (Stripe, PayPal)?
**A:** Use webhooks! Listen to your payment provider's webhook, then call our API from your backend.

---

## Platform-Specific Guides

### Shopify

Add to `Settings → Checkout → Order status page`:

```html
<script>
  {% if first_time_accessed %}
  fetch('https://naano.com/api/track/conversion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      revenue: {{ total_price | money_without_currency }},
      order_id: '{{ order_number }}'
    })
  });
  {% endif %}
</script>
```

### WordPress + WooCommerce

Add to `functions.php`:

```php
add_action('woocommerce_thankyou', 'naano_track_conversion');

function naano_track_conversion($order_id) {
    $order = wc_get_order($order_id);
    $session_id = $_COOKIE['naano_attribution'] ?? null;
    
    if ($session_id && !$order->get_meta('naano_tracked')) {
        // Call Naano API
        wp_remote_post('https://naano.com/api/track/conversion', [
            'headers' => [
                'Authorization' => 'Bearer YOUR_API_KEY',
                'Content-Type' => 'application/json'
            ],
            'body' => json_encode([
                'session_id' => $session_id,
                'revenue' => $order->get_total(),
                'order_id' => $order_id
            ])
        ]);
        
        $order->update_meta_data('naano_tracked', true);
        $order->save();
    }
}
```

### Stripe

Listen to `checkout.session.completed` webhook:

```javascript
stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

if (event.type === 'checkout.session.completed') {
  const session = event.data.object;
  
  // Get session_id from metadata (set during checkout)
  const naa noSessionId = session.metadata.naano_session_id;
  
  if (naanoSessionId) {
    await trackConversion(naanoSessionId, session.amount_total / 100);
  }
}
```

---

## Support

Need help? Contact us:
- Email: support@naano.com
- Dashboard: Settings → Support
- Documentation: https://docs.naano.com

---

**Last Updated:** December 2025  
**API Version:** v1

