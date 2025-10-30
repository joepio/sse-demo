use serde::{Deserialize, Serialize};

/// Local copy of PushSubscription struct so this module compiles even if other modules
/// haven't yet imported or re-exported it. Keeping a local definition here makes the
/// push implementation self-contained. If a single canonical definition exists elsewhere
/// (e.g., in `lib.rs`), you can remove this duplicate later.
#[derive(Clone, Serialize, Deserialize)]
pub struct PushSubscription {
    pub endpoint: String,
    #[serde(rename = "expirationTime")]
    pub expiration_time: Option<String>,
    pub keys: PushKeys,
}

/// Local copy of PushKeys used by PushSubscription.
#[derive(Clone, Serialize, Deserialize)]
pub struct PushKeys {
    pub p256dh: String,
    pub auth: String,
}

use serde_json::json;
use web_push::*;

/// Send a push notification to a subscription
///
/// This function constructs a Web Push payload and sends it using VAPID.
/// In production you should load the VAPID private key from a secure secret store,
/// not hardcode it.
pub async fn send_push_notification(
    subscription: &PushSubscription,
    title: &str,
    body: &str,
    url: &str,
    event_id: &str,
    event_actor: Option<&str>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    // VAPID private key - in production, load from environment variable or secret store
    // This is just an example key placeholder; replace it with a real key.
    let vapid_private_key = "TyRumaZoZxriruLdV6XyHV8ZzcDb9yHqpV7pQsgBHDM";

    // Build notification payload
    let payload = json!({
        "title": title,
        "body": body,
        "icon": "/icon-192.png",
        "badge": "/icon-192.png",
        "data": {
            "url": url,
            "eventId": event_id,
            "actor": event_actor
        }
    });

    // Build subscription info for web-push
    let subscription_info = SubscriptionInfo::new(
        &subscription.endpoint,
        &subscription.keys.p256dh,
        &subscription.keys.auth,
    );

    // Build the message
    let mut builder = WebPushMessageBuilder::new(&subscription_info)?;
    let payload_json = payload.to_string();
    builder.set_payload(ContentEncoding::Aes128Gcm, payload_json.as_bytes());

    // Add VAPID signature (using base64 private key)
    let sig_builder =
        VapidSignatureBuilder::from_base64(vapid_private_key, URL_SAFE_NO_PAD, &subscription_info)?;
    builder.set_vapid_signature(sig_builder.build()?);

    // Send the notification
    let client = WebPushClient::new()?;
    match client.send(builder.build()?).await {
        Ok(_) => {
            println!("📤 Push notification sent successfully");
            Ok(())
        }
        Err(e) => {
            eprintln!("❌ Failed to send push notification: {}", e);
            Err(Box::new(e))
        }
    }
}
