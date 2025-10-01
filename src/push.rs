// ===== Push Notification Handlers =====

use axum::{extract::State, http::StatusCode, Json};

use crate::{AppState, PushSubscription};

/// Subscribe to push notifications
pub async fn subscribe_push(
    State(state): State<AppState>,
    Json(subscription): Json<PushSubscription>,
) -> Result<StatusCode, StatusCode> {
    let mut subs = state.push_subscriptions.write().await;

    // Check if subscription already exists
    if !subs.iter().any(|s| s.endpoint == subscription.endpoint) {
        subs.push(subscription);
        println!(
            "✅ New push subscription added. Total subscriptions: {}",
            subs.len()
        );
    } else {
        println!("⚠️  Subscription already exists");
    }

    Ok(StatusCode::CREATED)
}

/// Unsubscribe from push notifications
pub async fn unsubscribe_push(
    State(state): State<AppState>,
    Json(subscription): Json<PushSubscription>,
) -> Result<StatusCode, StatusCode> {
    let mut subs = state.push_subscriptions.write().await;
    subs.retain(|s| s.endpoint != subscription.endpoint);
    println!(
        "🗑️  Push subscription removed. Total subscriptions: {}",
        subs.len()
    );
    Ok(StatusCode::OK)
}

/// Send a push notification to a subscription
pub async fn send_push_notification(
    subscription: &PushSubscription,
    title: &str,
    body: &str,
    url: &str,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    use web_push::*;

    // VAPID private key - in production, load from environment variable
    let vapid_private_key = "TyRumaZoZxriruLdV6XyHV8ZzcDb9yHqpV7pQsgBHDM";

    // Create notification payload
    let payload = serde_json::json!({
        "title": title,
        "body": body,
        "icon": "/icon-192.png",
        "badge": "/icon-192.png",
        "data": {
            "url": url
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

    // Add VAPID signature
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
