use serde::{Deserialize, Serialize};

/// Represents a Web Push subscription (as sent by browsers / clients).
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct PushSubscription {
    /// The endpoint URL for the push service.
    pub endpoint: String,

    /// Expiration time as an ISO string (if provided by the client).
    #[serde(rename = "expirationTime")]
    pub expiration_time: Option<String>,

    /// Encryption keys required to send the push message.
    pub keys: PushKeys,
}

/// Keys associated with a `PushSubscription`.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct PushKeys {
    pub p256dh: String,
    pub auth: String,
}
