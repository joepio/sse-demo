use chrono::{Duration, Utc};
use serde_json::{json, Value};
use std::collections::HashMap;
use uuid::Uuid;

/// Generate initial issues and their CloudEvents
pub fn generate_initial_data() -> (Vec<Value>, HashMap<String, Value>) {
    let mut events = Vec::new();
    let mut issues = HashMap::new();
    let base_time = Utc::now() - Duration::hours(2);

    // Create 10 initial issues using predefined templates
    let issue_templates = [
        (
            "Login system failing",
            "Users cannot authenticate",
            "high",
            Some("alice@example.com"),
        ),
        (
            "Dark mode request",
            "Add dark theme support",
            "medium",
            Some("bob@example.com"),
        ),
        ("Database performance", "Slow query responses", "high", None),
        (
            "Mobile UI issues",
            "Layout broken on mobile",
            "medium",
            Some("carol@example.com"),
        ),
        (
            "Email notifications",
            "Users not receiving emails",
            "high",
            Some("dave@example.com"),
        ),
        (
            "Search functionality",
            "Search returns no results",
            "medium",
            None,
        ),
        (
            "File upload bug",
            "Cannot upload large files",
            "low",
            Some("eve@example.com"),
        ),
        (
            "User profile page",
            "Profile data not saving",
            "medium",
            Some("frank@example.com"),
        ),
        (
            "API rate limiting",
            "Need to implement rate limits",
            "low",
            None,
        ),
        (
            "Documentation update",
            "API docs are outdated",
            "low",
            Some("grace@example.com"),
        ),
    ];

    // Generate create events for initial issues
    for (i, (title, description, priority, assignee)) in issue_templates.iter().enumerate() {
        let issue_id = (i + 1).to_string();
        let mut create_event =
            generate_create_event_with_data(&issue_id, title, description, priority, *assignee);

        // Set historical timestamp
        let create_time = base_time + Duration::minutes(i as i64 * 2);
        create_event["time"] = json!(create_time.to_rfc3339());

        // Extract issue data and add to issues state
        if let Some(issue_data) = create_event.get("data").cloned() {
            issues.insert(issue_id, issue_data);
        }

        events.push(create_event);
    }

    // Add some patch events using existing logic
    let patch_operations = [
        (
            "1",
            json!({"status": "in_progress", "assignee": "alice@example.com"}),
        ),
        (
            "3",
            json!({"status": "in_progress", "assignee": "bob@example.com"}),
        ),
        ("5", json!({"status": "closed", "resolution": "fixed"})),
        (
            "2",
            json!({"priority": "high", "title": "URGENT: Dark mode request"}),
        ),
        ("4", json!({"assignee": null, "status": "open"})),
        ("7", json!({"status": "in_progress"})),
        ("8", json!({"status": "closed", "resolution": "completed"})),
    ];

    for (i, (issue_id, patch_data)) in patch_operations.iter().enumerate() {
        let mut patch_event = generate_patch_event_with_data(issue_id, patch_data);

        // Set historical timestamp
        let patch_time = base_time + Duration::minutes(30 + (i as i64 * 3));
        patch_event["time"] = json!(patch_time.to_rfc3339());

        events.push(patch_event);

        // Apply patch to issues state
        if let Some(existing_issue) = issues.get_mut(*issue_id) {
            apply_merge_patch(existing_issue, patch_data);
        }
    }

    // Add delete events using existing logic
    let delete_operations = [("9", "duplicate"), ("10", "invalid request")];

    for (i, (issue_id, reason)) in delete_operations.iter().enumerate() {
        let mut delete_event = generate_delete_event_with_data(issue_id, reason);

        // Set historical timestamp
        let delete_time = base_time + Duration::minutes(60 + (i as i64 * 5));
        delete_event["time"] = json!(delete_time.to_rfc3339());

        events.push(delete_event);
        issues.remove(*issue_id);
    }

    (events, issues)
}

/// Apply JSON Merge Patch (RFC 7396) to a target JSON value
pub fn apply_merge_patch(target: &mut Value, patch: &Value) {
    if let (Value::Object(target_obj), Value::Object(patch_obj)) = (target, patch) {
        for (key, patch_value) in patch_obj {
            match patch_value {
                Value::Null => {
                    // Remove the field
                    target_obj.remove(key);
                }
                _ => {
                    // Set or replace the field
                    if let Some(target_value) = target_obj.get_mut(key) {
                        if target_value.is_object() && patch_value.is_object() {
                            // Recursively merge objects
                            apply_merge_patch(target_value, patch_value);
                        } else {
                            // Replace the value
                            *target_value = patch_value.clone();
                        }
                    } else {
                        // Add new field
                        target_obj.insert(key.clone(), patch_value.clone());
                    }
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_initial_data() {
        let (events, issues) = generate_initial_data();

        // Should have events for creation, patches, and deletes
        assert!(events.len() > 10);

        // Should have 8 issues remaining (10 created, 2 deleted)
        assert_eq!(issues.len(), 8);

        // All events should be valid CloudEvents
        for event in &events {
            assert!(event.get("specversion").is_some());
            assert!(event.get("id").is_some());
            assert!(event.get("source").is_some());
            assert!(event.get("type").is_some());
        }
    }

    #[test]
    fn test_apply_merge_patch() {
        let mut target = json!({
            "title": "Original",
            "status": "open",
            "assignee": "john@example.com"
        });

        let patch = json!({
            "status": "closed",
            "assignee": null,
            "resolution": "fixed"
        });

        apply_merge_patch(&mut target, &patch);

        assert_eq!(target["status"], "closed");
        assert_eq!(target["resolution"], "fixed");
        assert_eq!(target["assignee"], Value::Null);
        assert_eq!(target["title"], "Original"); // unchanged
    }

    #[test]
    fn test_generate_demo_event() {
        let mut issues = HashMap::new();
        issues.insert(
            "1".to_string(),
            json!({
                "id": "1",
                "title": "Test Issue",
                "status": "open"
            }),
        );
        issues.insert(
            "2".to_string(),
            json!({
                "id": "2",
                "title": "Another Issue",
                "status": "closed"
            }),
        );

        let demo_event = generate_demo_event(&issues);
        assert!(demo_event.is_some());

        let event = demo_event.unwrap();
        assert_eq!(event["specversion"], "1.0");
        assert!(event.get("id").is_some());
        assert!(event.get("source").is_some());
        assert!(event.get("type").is_some());
        assert!(event.get("time").is_some());

        // Should generate one of the valid event types
        let event_type = event["type"].as_str().unwrap();
        assert!(matches!(
            event_type,
            "com.example.issue.create" | "com.example.issue.patch" | "com.example.issue.delete"
        ));
    }

    #[test]
    fn test_generate_demo_event_empty_issues() {
        let empty_issues = HashMap::new();
        let demo_event = generate_demo_event(&empty_issues);
        assert!(demo_event.is_none());
    }
}

/// Generate a random demo CloudEvent that modifies an existing issue
pub fn generate_demo_event(existing_issues: &HashMap<String, Value>) -> Option<Value> {
    if existing_issues.is_empty() {
        return None;
    }

    let issue_ids: Vec<&String> = existing_issues.keys().collect();
    let random_issue_id = issue_ids[fastrand::usize(..issue_ids.len())];

    // Choose random operation type
    let operation_type = fastrand::usize(0..100);

    match operation_type {
        // 60% chance: patch operation
        0..60 => Some(generate_random_patch_event(random_issue_id)),
        // 20% chance: create new issue
        60..80 => Some(generate_random_create_event()),
        // 20% chance: delete operation (but only if we have more than 3 issues)
        _ => {
            if existing_issues.len() > 3 {
                Some(generate_random_delete_event(random_issue_id))
            } else {
                Some(generate_random_patch_event(random_issue_id))
            }
        }
    }
}

fn generate_random_patch_event(issue_id: &str) -> Value {
    let patch_operations = [
        json!({"status": "in_progress"}),
        json!({"status": "closed", "resolution": "fixed"}),
        json!({"status": "open"}),
        json!({"assignee": "demo@example.com"}),
        json!({"assignee": null}),
        json!({"priority": "high"}),
        json!({"priority": "low"}),
        json!({"title": "UPDATED: System maintenance required"}),
        json!({"title": "🔥 URGENT: Critical system failure"}),
        json!({"title": "✅ RESOLVED: All tests passing"}),
        json!({"title": "🐛 BUG FIX: Memory leak patched"}),
        json!({"title": "⚡ HOTFIX: Security patch deployed"}),
        json!({"title": "🚀 FEATURE: New functionality added"}),
        json!({"title": "📝 DOCS: Documentation updated"}),
        json!({"title": "Login system completely broken - CRITICAL"}),
        json!({"title": "Performance improvements needed ASAP"}),
        json!({"title": "UI glitch affecting all users"}),
        json!({"title": "Security vulnerability discovered"}),
        json!({"title": "Database optimization required"}),
    ];

    let random_patch = &patch_operations[fastrand::usize(..patch_operations.len())];
    generate_patch_event_with_data(issue_id, random_patch)
}

fn generate_patch_event_with_data(issue_id: &str, patch_data: &Value) -> Value {
    json!({
        "specversion": "1.0",
        "id": Uuid::now_v7().to_string(),
        "source": "/issues",
        "subject": issue_id,
        "type": "com.example.issue.patch",
        "time": Utc::now().to_rfc3339(),
        "datacontenttype": "application/merge-patch+json",
        "data": patch_data
    })
}

fn generate_random_create_event() -> Value {
    let titles = [
        "New bug discovered",
        "Feature enhancement request",
        "Performance optimization needed",
        "UI improvement suggestion",
        "Security vulnerability report",
    ];

    let priorities = ["low", "medium", "high"];
    let assignees = [
        None,
        Some("alice@example.com"),
        Some("bob@example.com"),
        Some("demo@example.com"),
    ];

    let issue_id = format!("live-{}", Uuid::now_v7().simple());
    let title = titles[fastrand::usize(..titles.len())];
    let priority = priorities[fastrand::usize(..priorities.len())];
    let assignee = assignees[fastrand::usize(..assignees.len())];

    generate_create_event_with_data(
        &issue_id,
        title,
        "Live generated issue for demo",
        priority,
        assignee,
    )
}

fn generate_create_event_with_data(
    issue_id: &str,
    title: &str,
    description: &str,
    priority: &str,
    assignee: Option<&str>,
) -> Value {
    let mut issue_data = json!({
        "id": issue_id,
        "title": title,
        "description": description,
        "status": "open",
        "priority": priority,
        "created_at": Utc::now().to_rfc3339()
    });

    if let Some(assignee_email) = assignee {
        issue_data["assignee"] = json!(assignee_email);
    }

    json!({
        "specversion": "1.0",
        "id": Uuid::now_v7().to_string(),
        "source": "/issues",
        "subject": issue_id,
        "type": "com.example.issue.create",
        "time": Utc::now().to_rfc3339(),
        "datacontenttype": "application/json",
        "data": issue_data
    })
}

fn generate_random_delete_event(issue_id: &str) -> Value {
    let reasons = ["duplicate", "invalid", "resolved elsewhere", "outdated"];
    let reason = reasons[fastrand::usize(..reasons.len())];
    generate_delete_event_with_data(issue_id, reason)
}

fn generate_delete_event_with_data(issue_id: &str, reason: &str) -> Value {
    json!({
        "specversion": "1.0",
        "id": Uuid::now_v7().to_string(),
        "source": "/issues",
        "subject": issue_id,
        "type": "com.example.issue.delete",
        "time": Utc::now().to_rfc3339(),
        "datacontenttype": "application/json",
        "data": {
            "id": issue_id,
            "reason": reason
        }
    })
}

/// Convert a JSON CloudEvent to a CloudEvent struct
pub fn json_to_cloudevent(json_event: &Value) -> Option<super::CloudEvent> {
    Some(super::CloudEvent {
        specversion: json_event.get("specversion")?.as_str()?.to_string(),
        id: json_event.get("id")?.as_str()?.to_string(),
        source: json_event.get("source")?.as_str()?.to_string(),
        subject: json_event
            .get("subject")
            .and_then(|s| s.as_str())
            .map(|s| s.to_string()),
        event_type: json_event.get("type")?.as_str()?.to_string(),
        time: json_event
            .get("time")
            .and_then(|t| t.as_str())
            .map(|s| s.to_string()),
        datacontenttype: json_event
            .get("datacontenttype")
            .and_then(|t| t.as_str())
            .map(|s| s.to_string()),
        data: json_event.get("data").cloned(),
    })
}
