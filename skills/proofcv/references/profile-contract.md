# Importable profile contract

ProofCV supports a subset of JSON Resume. Required: a `basics` object. Supported
display sections: `basics`, `work`, `projects`, `education`, `skills`.

```json
{
  "basics": {
    "name": "Person's real name",
    "label": "Professional title",
    "summary": "Supported by the person's actual experience",
    "email": "person@example.com",
    "location": {"city": "City"}
  },
  "work": [{
    "name": "Organization",
    "position": "Role",
    "startDate": "2023-06",
    "endDate": "2025-08",
    "highlights": ["A claim supported by a source"]
  }],
  "projects": [{"name": "Project", "description": "What it does", "highlights": []}],
  "education": [{"institution": "Institution", "studyType": "Qualification", "area": "Field"}],
  "skills": [{"name": "Development", "keywords": ["Python"]}]
}
```

Do not copy this placeholder into a person's profile as fact. String fields are
limited to 12,000 characters, each section to 50 entries, and highlight/keyword
arrays to 100 strings. Unsupported sections are retained in JSON exports but not
rendered; tell the user about that limitation. The app does not fully validate the
external JSON Resume schema. Empty end dates display as Present when a start
date exists: confirm ongoing roles rather than treating an unknown end as current.

For a factual rewrite ledger, use columns: `source pointer`, `original`, `draft`,
`reason`, `needs confirmation`. A path such as `work[0].highlights[1]` identifies
the original field. Retain a private original backup so edits can be reviewed.
