use chrono::{Duration, Utc};
use serde_json::{json, Value};
use std::collections::HashMap;
use uuid::Uuid;

/// Generate initial issues and their CloudEvents
pub fn generate_initial_data() -> (Vec<Value>, HashMap<String, Value>) {
    let mut events = Vec::new();
    let mut issues = HashMap::new();
    let base_time = Utc::now() - Duration::hours(3);

    // Create 10 initial zaken using predefined templates
    let issue_templates = [
        (
            "Nieuw paspoort aanvragen",
            "Burger wil nieuw paspoort aanvragen",
            Some("alice@gemeente.nl"),
        ),
        (
            "Melding overlast",
            "Geluidsoverlast buren gemeld",
            Some("bob@gemeente.nl"),
        ),
        (
            "Verhuizing doorgeven",
            "Adreswijziging registreren in BRP",
            None,
        ),
        (
            "Parkeervergunning aanvraag",
            "Bewoner wil parkeervergunning voor nieuwe auto",
            Some("carol@gemeente.nl"),
        ),
        (
            "Kapvergunning boom",
            "Vergunning nodig voor kappen boom in achtertuin",
            Some("dave@gemeente.nl"),
        ),
        (
            "Uitkering aanvragen",
            "Burger vraagt bijstandsuitkering aan",
            None,
        ),
        (
            "Klacht over dienstverlening",
            "Ontevreden over behandeling bij balie",
            Some("eve@gemeente.nl"),
        ),
        (
            "Huwelijk voltrekken",
            "Koppel wil trouwen op gemeentehuis",
            Some("frank@gemeente.nl"),
        ),
        (
            "WOZ-bezwaar indienen",
            "Eigenaar niet eens met WOZ-waardering",
            None,
        ),
        (
            "Hondenbelasting",
            "Registratie nieuwe hond voor hondenbelasting",
            Some("grace@gemeente.nl"),
        ),
    ];

    // Generate create events for initial issues
    for (i, (title, description, assignee)) in issue_templates.iter().enumerate() {
        let issue_id = (i + 1).to_string();
        let mut create_event =
            generate_create_event_with_data(&issue_id, title, description, *assignee);

        // Set historical timestamp
        let create_time = base_time + Duration::minutes(i as i64 * 2);
        create_event["time"] = json!(create_time.to_rfc3339());

        // Extract issue data and add to issues state
        if let Some(data) = create_event.get("data") {
            if let Some(item_data) = data.get("item_data").cloned() {
                issues.insert(issue_id, item_data);
            }
        }

        events.push(create_event);
    }

    // Add some patch events using existing logic
    let patch_operations = [
        (
            "1",
            json!({"status": "in_progress", "assignee": "alice@gemeente.nl"}),
        ),
        (
            "3",
            json!({"status": "in_progress", "assignee": "bob@gemeente.nl"}),
        ),
        ("5", json!({"status": "closed", "resolution": "fixed"})),
        ("4", json!({"assignee": null, "status": "open"})),
        ("7", json!({"status": "in_progress"})),
        ("8", json!({"status": "closed", "resolution": "completed"})),
    ];

    for (i, (issue_id, patch_data)) in patch_operations.iter().enumerate() {
        let mut patch_event = generate_patch_event_with_data(issue_id, patch_data);

        // Set historical timestamp
        let patch_time = base_time + Duration::minutes(30 + (i as i64 * 3));
        patch_event["time"] = json!(patch_time.to_rfc3339());

        // Apply patch to issues state
        if let Some(existing_issue) = issues.get_mut(&issue_id.to_string()) {
            if let Some(data) = patch_event.get("data") {
                if let Some(item_data) = data.get("item_data") {
                    apply_merge_patch(existing_issue, item_data);
                }
            }
        }

        events.push(patch_event);
    }

    // Add delete events using existing logic
    let delete_operations = [("9", "duplicate"), ("10", "invalid request")];

    for (i, (issue_id, reason)) in delete_operations.iter().enumerate() {
        let mut delete_event = generate_delete_event_with_data(issue_id, reason);

        // Set historical timestamp
        let delete_time = base_time + Duration::minutes(60 + (i as i64 * 5));
        delete_event["time"] = json!(delete_time.to_rfc3339());

        events.push(delete_event);
        issues.remove(&issue_id.to_string());
    }

    // Add sample timeline events according to EVENT_DESIGN.md
    let timeline_operations = [
        (
            "1",
            "comment",
            "comment-1001",
            "alice@gemeente.nl",
            json!({
                "content": "Ik ben deze zaak aan het behandelen. Meer informatie volgt.",
                "parent_id": null,
                "mentions": ["@bob"]
            }),
            105,
        ),
        (
            "2",
            "status_change",
            "status-1002",
            "bob@gemeente.nl",
            json!({
                "field": "status",
                "old_value": "open",
                "new_value": "in_progress",
                "reason": "Start onderzoek"
            }),
            110,
        ),
        (
            "1",
            "llm_analysis",
            "llm-1003",
            "system@example.com",
            json!({
                "prompt": "Analyze this authentication issue and provide recommendations",
                "response": "This appears to be related to session timeout configuration. The llmauthentication system is likely expiring sessions too quickly, causing users to be logged out unexpectedly.",
                "model": "gpt-4",
                "confidence": 0.87
            }),
            115,
        ),
        (
            "2",
            "comment",
            "comment-1004",
            "alice@gemeente.nl",
            json!({
                "content": "De zaak is in behandeling genomen en doorgestuurd naar de juiste afdeling.",
                "parent_id": null,
                "mentions": []
            }),
            120,
        ),
        (
            "1",
            "task",
            "task-1005",
            "system@gemeente.nl",
            json!({
                "cta": "Documenten Controleren",
                "description": "Controleer de ingediende paspoort aanvraag documenten",
                "url": "/review/passport-1",
                "completed": false,
                "deadline": "2025-09-26"
            }),
            125,
        ),
        (
            "2",
            "task",
            "task-1006",
            "workflow@gemeente.nl",
            json!({
                "cta": "Locatie Inspecteren",
                "description": "Voer inspectie ter plaatse uit voor geluidsoverlast melding",
                "url": "/inspect/noise-complaint-2",
                "completed": false,
                "deadline": "2025-09-24"
            }),
            130,
        ),
        (
            "3",
            "task",
            "task-1007",
            "system@gemeente.nl",
            json!({
                "cta": "Aanvrager Bellen",
                "description": "Bel aanvrager om nieuwe adresgegevens te bevestigen",
                "url": "/contact/applicant-3",
                "completed": false,
                "deadline": "2025-09-25"
            }),
            135,
        ),
    ];

    // Add planning events for most issues
    let planning_operations = [
        (
            "1",
            "planning",
            "planning-1001",
            "specialist@gemeente.nl",
            json!({
                "title": "Paspoort procedure",
                "description": "Stappen voor verwerking paspoort aanvraag",
                "moments": [
                    {
                        "id": "moment-1001-1",
                        "date": "2024-12-18",
                        "title": "Aanvraag ontvangen",
                        "status": "completed"
                    },
                    {
                        "id": "moment-1001-2",
                        "date": "2024-12-19",
                        "title": "Documenten controleren",
                        "status": "current"
                    },
                    {
                        "id": "moment-1001-3",
                        "date": "2024-12-23",
                        "title": "Foto en vingerafdrukken",
                        "status": "planned"
                    },
                    {
                        "id": "moment-1001-4",
                        "date": "2024-12-30",
                        "title": "Paspoort uitreiken",
                        "status": "planned"
                    }
                ]
            }),
            140,
        ),
        (
            "2",
            "planning",
            "planning-1002",
            "bob@gemeente.nl",
            json!({
                "title": "Overlast onderzoek",
                "description": "Plan voor onderzoek geluidsoverlast",
                "moments": [
                    {
                        "id": "moment-1002-1",
                        "date": "2024-12-18",
                        "title": "Melding geregistreerd",
                        "status": "completed"
                    },
                    {
                        "id": "moment-1002-2",
                        "date": "2024-12-20",
                        "title": "Locatie inspectie",
                        "status": "current"
                    },
                    {
                        "id": "moment-1002-3",
                        "date": "2024-12-27",
                        "title": "Rapport opstellen",
                        "status": "planned"
                    },
                    {
                        "id": "moment-1002-4",
                        "date": "2025-01-03",
                        "title": "Besluit communiceren",
                        "status": "planned"
                    }
                ]
            }),
            142,
        ),
        (
            "4",
            "planning",
            "planning-1004",
            "carol@gemeente.nl",
            json!({
                "title": "Parkeervergunning proces",
                "description": "Behandeling parkeervergunning aanvraag",
                "moments": [
                    {
                        "id": "moment-1004-1",
                        "date": "2024-12-17",
                        "title": "Aanvraag ingediend",
                        "status": "completed"
                    },
                    {
                        "id": "moment-1004-2",
                        "date": "2024-12-18",
                        "title": "Administratieve check",
                        "status": "completed"
                    },
                    {
                        "id": "moment-1004-3",
                        "date": "2024-12-21",
                        "title": "Locatie controle",
                        "status": "current"
                    },
                    {
                        "id": "moment-1004-4",
                        "date": "2024-12-24",
                        "title": "Vergunning versturen",
                        "status": "planned"
                    }
                ]
            }),
            144,
        ),
        (
            "5",
            "planning",
            "planning-1005",
            "dave@gemeente.nl",
            json!({
                "title": "Kapvergunning procedure",
                "description": "Verwerking aanvraag boom kappen",
                "moments": [
                    {
                        "id": "moment-1005-1",
                        "date": "2024-12-16",
                        "title": "Aanvraag ontvangen",
                        "status": "completed"
                    },
                    {
                        "id": "moment-1005-2",
                        "date": "2024-12-17",
                        "title": "Ecologisch onderzoek",
                        "status": "completed"
                    },
                    {
                        "id": "moment-1005-3",
                        "date": "2024-12-20",
                        "title": "Besluit genomen",
                        "status": "completed"
                    },
                    {
                        "id": "moment-1005-4",
                        "date": "2024-12-21",
                        "title": "Vergunning uitgereikt",
                        "status": "completed"
                    }
                ]
            }),
            146,
        ),
        (
            "7",
            "planning",
            "planning-1007",
            "eve@gemeente.nl",
            json!({
                "title": "Klacht behandeling",
                "description": "Proces voor behandeling klacht dienstverlening",
                "moments": [
                    {
                        "id": "moment-1007-1",
                        "date": "2024-12-19",
                        "title": "Klacht geregistreerd",
                        "status": "completed"
                    },
                    {
                        "id": "moment-1007-2",
                        "date": "2024-12-20",
                        "title": "Onderzoek gestart",
                        "status": "current"
                    },
                    {
                        "id": "moment-1007-3",
                        "date": "2024-12-28",
                        "title": "Gesprek met betrokkenen",
                        "status": "planned"
                    },
                    {
                        "id": "moment-1007-4",
                        "date": "2025-01-08",
                        "title": "Besluit en reactie",
                        "status": "planned"
                    }
                ]
            }),
            148,
        ),
    ];

    // Add initial citizen stories/requests as first comments
    let citizen_stories = [
        (
            "1",
            "comment",
            "story-1001",
            "pietjansen@hotmail.com",
            json!({
                "content": "Hallo, ik wil graag een nieuw paspoort aanvragen. Mijn huidige paspoort verloopt over 2 maanden en ik ga binnenkort op vakantie naar Spanje. Wat moet ik allemaal meebrengen naar de afspraak?",
                "parent_id": null,
                "mentions": []
            }),
            5,
        ),
        (
            "2",
            "comment",
            "story-1002",
            "marieke.de.vries@gmail.com",
            json!({
                "content": "Beste gemeente, ik wil graag melding maken van geluidsoverlast van mijn buren. Ze hebben elke avond tot laat muziek aan staan en dit begint nu echt vervelend te worden. Kunnen jullie hier iets aan doen?",
                "parent_id": null,
                "mentions": []
            }),
            7,
        ),
        (
            "3",
            "comment",
            "story-1003",
            "jan.klaassen@ziggo.nl",
            json!({
                "content": "Hallo, ik ben vorige maand verhuisd van Amsterdam naar jullie gemeente. Ik wil mijn nieuwe adres doorgeven in de BRP. Kan ik dit online regelen of moet ik langskomen?",
                "parent_id": null,
                "mentions": []
            }),
            10,
        ),
        (
            "4",
            "comment",
            "story-1004",
            "a.peters@live.nl",
            json!({
                "content": "Beste mensen, ik heb een nieuwe auto gekocht en wil graag een parkeervergunning aanvragen voor mijn straat. Ik woon op de Kerkstraat 15. Wat zijn de kosten en hoe lang duurt dit proces?",
                "parent_id": null,
                "mentions": []
            }),
            12,
        ),
        (
            "5",
            "comment",
            "story-1005",
            "kees.van.dijk@kpn.nl",
            json!({
                "content": "Hallo gemeente, ik heb een grote boom in mijn achtertuin die ik graag wil laten kappen. De boom wordt te groot en hangt over naar de buren. Heb ik hiervoor een vergunning nodig?",
                "parent_id": null,
                "mentions": []
            }),
            15,
        ),
        (
            "6",
            "comment",
            "story-1006",
            "susan.bakker@yahoo.com",
            json!({
                "content": "Beste gemeente, ik zit in financiële problemen en zou graag informatie willen over bijstandsuitkering. Ik ben onlangs werkloos geworden en weet niet goed waar ik moet beginnen. Kunnen jullie mij helpen?",
                "parent_id": null,
                "mentions": []
            }),
            18,
        ),
        (
            "7",
            "comment",
            "story-1007",
            "henk.groot@planet.nl",
            json!({
                "content": "Ik wil een klacht indienen over de behandeling die ik heb gekregen bij jullie balie vorige week. De medewerker was onvriendelijk en onbehulpzaam. Dit kan echt beter!",
                "parent_id": null,
                "mentions": []
            }),
            20,
        ),
        (
            "8",
            "comment",
            "story-1008",
            "annemarie@xs4all.nl",
            json!({
                "content": "Hallo lieve mensen van de gemeente! Mijn verloofde en ik willen graag trouwen op het gemeentehuis. Kunnen we een afspraak maken voor over 2 maanden? We houden van een simpele ceremonie.",
                "parent_id": null,
                "mentions": []
            }),
            22,
        ),
    ];

    for (_i, (issue_id, item_type, item_id, actor, item_data, minute_offset)) in
        citizen_stories.iter().enumerate()
    {
        let story_event = json!({
            "specversion": "1.0",
            "id": Uuid::now_v7().to_string(),
            "source": "server-demo-event",
            "subject": issue_id,
            "type": "item.created",
            "time": (base_time + Duration::minutes(*minute_offset)).to_rfc3339(),
            "datacontenttype": "application/json",
            "data": {
                "item_type": item_type,
                "item_id": item_id,
                "actor": actor,
                "timestamp": (base_time + Duration::minutes(*minute_offset)).to_rfc3339(),
                "item_data": item_data
            }
        });

        events.push(story_event);
    }

    for (_i, (issue_id, item_type, item_id, actor, item_data, minute_offset)) in
        timeline_operations.iter().enumerate()
    {
        let timeline_event = json!({
            "specversion": "1.0",
            "id": Uuid::now_v7().to_string(),
            "source": "server-demo-event",
            "subject": issue_id,
            "type": "item.created",
            "time": (base_time + Duration::minutes(*minute_offset)).to_rfc3339(),
            "datacontenttype": "application/json",
            "data": {
                "item_type": item_type,
                "item_id": item_id,
                "actor": actor,
                "timestamp": (base_time + Duration::minutes(*minute_offset)).to_rfc3339(),
                "item_data": item_data
            }
        });

        events.push(timeline_event);
    }

    for (_i, (issue_id, item_type, item_id, actor, item_data, minute_offset)) in
        planning_operations.iter().enumerate()
    {
        let planning_event = json!({
            "specversion": "1.0",
            "id": Uuid::now_v7().to_string(),
            "source": "server-demo-event",
            "subject": issue_id,
            "type": "item.created",
            "time": (base_time + Duration::minutes(*minute_offset)).to_rfc3339(),
            "datacontenttype": "application/json",
            "data": {
                "item_type": item_type,
                "item_id": item_id,
                "actor": actor,
                "timestamp": (base_time + Duration::minutes(*minute_offset)).to_rfc3339(),
                "item_data": item_data
            }
        });

        events.push(planning_event);
    }

    // Add a timeline update event
    let timeline_update_event = json!({
        "specversion": "1.0",
        "id": Uuid::now_v7().to_string(),
        "source": "server-demo-event",
        "subject": "1",
        "type": "item.updated",
        "time": (base_time + Duration::minutes(90)).to_rfc3339(),
        "datacontenttype": "application/merge-patch+json",
        "data": {
            "item_type": "comment",
            "item_id": "comment-1001",
            "actor": "alice@example.com",
            "timestamp": (base_time + Duration::minutes(90)).to_rfc3339(),
            "patch": {
                "content": "I'm investigating this authentication issue. Will check the session timeout settings. UPDATE: Found some relevant logs in the auth service.",
                "edited_at": (base_time + Duration::minutes(90)).to_rfc3339()
            }
        }
    });

    events.push(timeline_update_event);

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
            "title": "Originele Zaak",
            "status": "open",
            "assignee": "john@gemeente.nl"
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
        assert_eq!(target["title"], "Originele Zaak"); // unchanged
    }

    #[test]
    fn test_generate_demo_event() {
        let mut issues = HashMap::new();
        issues.insert(
            "1".to_string(),
            json!({
                "id": "1",
                "title": "Test Zaak",
                "status": "open"
            }),
        );
        issues.insert(
            "2".to_string(),
            json!({
                "id": "2",
                "title": "Andere Zaak",
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
            "item.created" | "item.updated" | "item.deleted"
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
        0..60 => Some(generate_random_comment_event(random_issue_id)),
        60..75 => Some(generate_random_task_event(random_issue_id)),
        75..90 => Some(generate_random_planning_event(random_issue_id)),
        _ => Some(generate_random_patch_event(random_issue_id)),
    }
}

fn generate_random_patch_event(issue_id: &str) -> Value {
    let patch_operations = [
        json!({"status": "open"}),
        json!({"status": "in_behandeling"}),
        json!({"status": "wachtend_op_informatie"}),
        json!({"status": "in_beoordeling"}),
        json!({"status": "gereed_voor_besluit"}),
        json!({"status": "afgesloten", "resolution": "toegekend"}),
        json!({"status": "afgesloten", "resolution": "afgewezen"}),
        json!({"status": "afgesloten", "resolution": "ingetrokken"}),
        json!({"assignee": "alice@gemeente.nl"}),
        json!({"assignee": "bob@gemeente.nl"}),
        json!({"assignee": "specialist@gemeente.nl"}),
        json!({"assignee": null}),
        json!({"priority": "hoog"}),
        json!({"priority": "normaal"}),
        json!({"priority": "laag"}),
        json!({"category": "omgevingsvergunning"}),
        json!({"category": "melding_openbare_ruimte"}),
        json!({"category": "bijstandsverzoek"}),
        json!({"category": "woo_verzoek"}),
        json!({"category": "parkeervergunning"}),
        json!({"due_date": "2024-03-15"}),
        json!({"due_date": "2024-04-01"}),
        json!({"tags": ["urgent", "spoed"]}),
        json!({"tags": ["complex"]}),
        json!({"tags": ["externe_partij"]}),
        json!({"department": "omgeving_en_vergunningen"}),
        json!({"department": "publiekszaken"}),
        json!({"department": "sociale_zaken"}),
        json!({"department": "juridische_zaken"}),
    ];

    let random_patch = &patch_operations[fastrand::usize(..patch_operations.len())];
    generate_patch_event_with_data(issue_id, random_patch)
}

fn generate_patch_event_with_data(issue_id: &str, patch_data: &Value) -> Value {
    json!({
        "specversion": "1.0",
        "id": Uuid::now_v7().to_string(),
        "source": "server-demo-event",
        "subject": issue_id,
        "type": "item.updated",
        "time": Utc::now().to_rfc3339(),
        "datacontenttype": "application/merge-patch+json",
        "data": {
            "item_type": "issue",
            "item_id": issue_id,
            "item_data": patch_data
        }
    })
}

fn generate_create_event_with_data(
    issue_id: &str,
    title: &str,
    description: &str,
    assignee: Option<&str>,
) -> Value {
    let mut issue_data = json!({
        "id": issue_id,
        "title": title,
        "description": description,
        "status": "open",
        "created_at": Utc::now().to_rfc3339()
    });

    if let Some(assignee_email) = assignee {
        issue_data["assignee"] = json!(assignee_email);
    }

    json!({
        "specversion": "1.0",
        "id": Uuid::now_v7().to_string(),
        "source": "server-demo-event",
        "subject": issue_id,
        "type": "item.created",
        "time": Utc::now().to_rfc3339(),
        "datacontenttype": "application/json",
        "data": {
            "item_type": "issue",
            "item_id": issue_id,
            "item_data": issue_data
        }
    })
}

fn generate_delete_event_with_data(issue_id: &str, reason: &str) -> Value {
    json!({
        "specversion": "1.0",
        "id": Uuid::now_v7().to_string(),
        "source": "server-demo-event",
        "subject": issue_id,
        "type": "item.deleted",
        "time": Utc::now().to_rfc3339(),
        "datacontenttype": "application/json",
        "data": {
            "item_type": "issue",
            "item_id": issue_id,
            "item_data": {
                "id": issue_id,
                "reason": reason
            }
        }
    })
}

fn generate_random_comment_event(issue_id: &str) -> Value {
    let official_comments = [
        "Status update: bezig met verwerking van deze aanvraag.",
        "Aanvullende informatie ontvangen van aanvrager.",
        "Doorverwezen naar de juiste afdeling voor behandeling.",
        "Locatie inspectie gepland voor volgende week.",
        "Advies gevraagd aan externe adviseur.",
        "Alle benodigde documenten zijn nu compleet.",
        "Zaak is in behandeling genomen door specialist.",
        "Eerste beoordeling van de aanvraag afgerond.",
        "Contact opgenomen met betrokken partijen.",
        "Verdere analyse van de situatie vereist.",
        "Planning gemaakt voor vervolgstappen.",
        "Overleg gepland met collega's over deze zaak.",
        "Termijn verlengd na overleg met aanvrager.",
        "Advies van juridische afdeling ingewonomen.",
        "Technische beoordeling uitgevoerd ter plaatse.",
        "Afspraak ingepland met aanvrager voor volgende week.",
        "Zaak doorgestuurd naar behandelend ambtenaar.",
        "Extra documentatie opgevraagd bij externe partij.",
        "Interne afstemming afgerond, kan door naar volgende fase.",
        "Wachten op goedkeuring van leidinggevende.",
        "Controle uitgevoerd, alles in orde bevonden.",
        "Vraag gesteld aan ICT-afdeling over technische aspecten.",
        "Besluitvorming uitgesteld tot na vakantieperiode.",
        "Prioriteit verhoogd vanwege urgentie van de aanvraag.",
        "Aanvraag gemarkeerd voor extra aandacht van senior medewerker.",
        "Update: wachten op reactie van externe instantie.",
        "Telefonisch contact gehad met aanvrager over voortgang.",
        "Zaak tijdelijk on-hold gezet vanwege onduidelijkheden.",
        "Herziening van de aanvraag na nieuwe informatie.",
        "Consultant ingeschakeld voor specialistisch advies.",
    ];

    let citizen_comments = [
        "Hallo waarom duurt dit zo lang? Het is al 3 weken geleden!",
        "Kan iemand mij uitleggen wat er gebeurt met mijn aanvraag?",
        "Ik heb nog steeds niks gehoord... Is er iemand die dit oppakt?",
        "Dit is belachelijk, waarom duurt alles bij de gemeente zo lang?",
        "Wanneer kan ik eindelijk een reactie verwachten?",
        "Mijn buurman had hetzelfde probleem en die kreeg binnen een week antwoord!",
        "Kunnen jullie niet wat sneller werken? Ik heb deadline!",
        "Is er überhaupt iemand die naar mijn zaak kijkt?",
        "Vriendelijk verzoek om even te laten weten wat de status is 🙏",
        "Help! Ik word gek van het wachten, wat gebeurt er nou?",
        "Ik begrijp er helemaal niks van... kan iemand uitleg geven?",
        "Dit is toch niet normaal? Zo lang wachten voor een simpele aanvraag?",
        "Volgens de website zou dit binnen 2 weken afgehandeld zijn...",
        "Ik ga een klacht indienen als dit niet snel opgelost wordt!",
        "Hoe moeilijk kan het zijn om even te reageren?",
        "Mijn geduld raakt op... wanneer krijg ik nou antwoord?",
        "Dit is de 5e keer dat ik contact opneem. HELP!",
        "Ik snap er niks van. Waarom is dit zo ingewikkeld?",
        "Kan er niet gewoon even iemand bellen om dit uit te leggen?",
        "Dit is echt frustrerend... ik wacht al maanden!",
    ];

    let official_actors = [
        "alice@gemeente.nl",
        "bob@gemeente.nl",
        "carol@gemeente.nl",
        "demo@gemeente.nl",
        "specialist@gemeente.nl",
    ];

    let citizen_actors = [
        "pietjansen@hotmail.com",
        "marieke.de.vries@gmail.com",
        "jan.klaassen@ziggo.nl",
        "a.peters@live.nl",
        "kees.van.dijk@kpn.nl",
        "susan.bakker@yahoo.com",
        "henk.groot@planet.nl",
        "annemarie@xs4all.nl",
    ];

    // 70% chance of citizen comment to make them more common
    let is_citizen_comment = fastrand::usize(0..100) < 70;

    let (comment_text, actor) = if is_citizen_comment {
        let comment = citizen_comments[fastrand::usize(..citizen_comments.len())];
        let actor = citizen_actors[fastrand::usize(..citizen_actors.len())];
        (comment, actor)
    } else {
        let comment = official_comments[fastrand::usize(..official_comments.len())];
        let actor = official_actors[fastrand::usize(..official_actors.len())];
        (comment, actor)
    };

    generate_comment_event_with_data(issue_id, comment_text, actor)
}

fn generate_comment_event_with_data(issue_id: &str, content: &str, actor: &str) -> Value {
    json!({
        "specversion": "1.0",
        "id": Uuid::now_v7().to_string(),
        "source": "server-demo-event",
        "subject": issue_id,
        "type": "item.created",
        "time": Utc::now().to_rfc3339(),
        "datacontenttype": "application/json",
        "data": {
            "item_type": "comment",
            "item_id": format!("comment-{}", Uuid::now_v7().simple()),
            "actor": actor,
            "timestamp": Utc::now().to_rfc3339(),
            "item_data": {
                "content": content,
                "parent_id": null,
                "mentions": []
            }
        }
    })
}

/// Generate a random task timeline item for an issue
fn generate_random_task_event(issue_id: &str) -> Value {
    let tasks = [
        (
            "Documenten Controleren",
            "Controleer de ingediende documenten op volledigheid",
            "/review/documents",
        ),
        (
            "Afspraak Inplannen",
            "Plan een afspraak in met de aanvrager",
            "/schedule/appointment",
        ),
        (
            "Locatie Inspecteren",
            "Voer een inspectie ter plaatse uit",
            "/inspect/location",
        ),
        (
            "Aanvrager Bellen",
            "Bel de aanvrager voor aanvullende informatie",
            "/contact/applicant",
        ),
        (
            "Ontbrekende Documenten",
            "Upload ontbrekende documentatie naar het systeem",
            "/upload/documents",
        ),
        (
            "Juridische Controle",
            "Laat deze zaak controleren door de juridische afdeling",
            "/review/legal",
        ),
        (
            "Betaling Verwerken",
            "Verwerk de betaling voor leges",
            "/payment/process",
        ),
        (
            "Melding Versturen",
            "Stuur statusupdate naar aanvrager",
            "/send/notification",
        ),
        (
            "Eindcontrole aanvragen",
            "Voer eindcontrole uit voordat de zaak wordt afgerond",
            "/check/final",
        ),
    ];

    let actors = [
        "system@gemeente.nl",
        "workflow@gemeente.nl",
        "alice@gemeente.nl",
        "bob@gemeente.nl",
    ];

    let (cta, description, url) = tasks[fastrand::usize(..tasks.len())];
    let actor = actors[fastrand::usize(..actors.len())];

    generate_task_event_with_data(issue_id, cta, description, url, actor)
}

fn generate_task_event_with_data(
    issue_id: &str,
    cta: &str,
    description: &str,
    url: &str,
    actor: &str,
) -> Value {
    // Generate a deadline 1-5 days from now
    let days_ahead = fastrand::usize(1..=5);
    let deadline = (Utc::now() + Duration::days(days_ahead as i64))
        .format("%Y-%m-%d")
        .to_string();
    json!({
        "specversion": "1.0",
        "id": Uuid::now_v7().to_string(),
        "source": "server-demo-event",
        "subject": issue_id,
        "type": "item.created",
        "time": Utc::now().to_rfc3339(),
        "datacontenttype": "application/json",
        "data": {
            "item_type": "task",
            "item_id": format!("task-{}", Uuid::now_v7().simple()),
            "actor": actor,
            "timestamp": Utc::now().to_rfc3339(),
            "item_data": {
                "cta": cta,
                "description": description,
                "url": url,
                "completed": false,
                "deadline": deadline
            }
        }
    })
}

/// Generate a random planning event for an issue
fn generate_random_planning_event(issue_id: &str) -> Value {
    let plannings = [
        (
            "Vergunningsprocedure",
            "Proces voor het verkrijgen van de benodigde vergunningen",
            vec![
                ("Aanvraag indienen", "completed"),
                ("Behandeling door gemeente", "current"),
                ("Besluit gemeente", "planned"),
                ("Bezwaarperiode", "planned"),
                ("Vergunning geldig", "planned"),
            ],
        ),
        (
            "Verhuisprocedure",
            "Bij het verhuizen houden we ons aan de regels en richtlijnen van de gemeente.",
            vec![
                ("Doorgeven adreswijziging", "completed"),
                ("Update kadaster", "current"),
                ("Update gemeentedata", "planned"),
                ("Diensten wijzigen", "planned"),
                ("Informeren nieuwe bewoners", "planned"),
            ],
        ),
        (
            "Juridische procedure",
            "Stappen in de juridische behandeling",
            vec![
                ("Intake", "completed"),
                ("Onderzoek", "completed"),
                ("Advies opstellen", "current"),
                ("Besluitvorming", "planned"),
                ("Communicatie besluit", "planned"),
            ],
        ),
    ];

    let actors = [
        "specialist@gemeente.nl",
        "projectleider@gemeente.nl",
        "juridisch@gemeente.nl",
        "vergunningen@gemeente.nl",
    ];

    let (title, description, moments_data) = &plannings[fastrand::usize(..plannings.len())];
    let actor = actors[fastrand::usize(..actors.len())];

    generate_planning_event_with_data(issue_id, title, description, moments_data, actor)
}

fn generate_planning_event_with_data(
    issue_id: &str,
    title: &str,
    description: &str,
    moments_data: &Vec<(&str, &str)>,
    actor: &str,
) -> Value {
    // Generate moments with dates spread over the next few months
    let mut moments = Vec::new();
    let base_date = Utc::now();

    for (index, (moment_title, status)) in moments_data.iter().enumerate() {
        let days_offset = match status {
            &"completed" => -(fastrand::i64(5..=30)), // Past dates
            &"current" => fastrand::i64(-2..=2),      // Around now
            _ => fastrand::i64(7..=(30 + index as i64 * 14)), // Future dates
        };

        let moment_date = (base_date + Duration::days(days_offset))
            .format("%Y-%m-%d")
            .to_string();

        moments.push(json!({
            "id": format!("moment-{}", Uuid::now_v7().simple()),
            "date": moment_date,
            "title": moment_title,
            "status": status
        }));
    }

    json!({
        "specversion": "1.0",
        "id": Uuid::now_v7().to_string(),
        "source": "server-demo-event",
        "subject": issue_id,
        "type": "item.created",
        "time": Utc::now().to_rfc3339(),
        "datacontenttype": "application/json",
        "data": {
            "item_type": "planning",
            "item_id": format!("planning-{}", Uuid::now_v7().simple()),
            "actor": actor,
            "timestamp": Utc::now().to_rfc3339(),
            "item_data": {
                "title": title,
                "description": description,
                "moments": moments
            }
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
