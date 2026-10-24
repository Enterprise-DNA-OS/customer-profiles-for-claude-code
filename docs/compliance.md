# Privacy and identity review checks

Checked 24 October 2026. These checks organise evidence for a responsible data owner. They do not certify compliance, establish consent to send, or decide legal exceptions. No customer record is deleted automatically.

| Check | Behaviour | Source |
|---|---|---|
| Purpose missing | Flags a source without a documented collection purpose | [NZ IPP1 and privacy principles](https://www.privacy.org.nz/privacy-principles/) |
| Notice evidence missing | Flags sources with no notification or exception review reference | [NZ IPP3A](https://www.privacy.org.nz/privacy-principles/3a/) |
| Identity conflict or missing name | Flags conflicting names/emails in reviewed profiles and missing source names | [NZ IPP8](https://www.privacy.org.nz/privacy-principles/), [AU APP10](https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-10-app-10-quality-of-personal-information) |
| Retention review due | Flags an operator-set review date in the past, with no purge | [NZ IPP9](https://www.privacy.org.nz/privacy-principles/), [AU APP11](https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-11-app-11-security-of-personal-information) |
| Owner missing | Flags the absence of an accountable reviewer | Internal operating control, not a statutory role requirement |

NZ IPP3A took effect on 1 May 2026 and concerns notification when collecting personal information indirectly. Exceptions exist. A nonempty notice reference is evidence to inspect, not proof that notification was sufficient. Applicability depends on the collection circumstances and jurisdiction.

Australian APP obligations apply to APP entities. APP11 includes circumstances where destruction or de-identification is required, with exceptions for required retention and Commonwealth records. Retention review dates in this tool are business settings, not legal deadlines. Confirm other recordkeeping duties before purging anything, including original exports, audit history, backups and generated documents.

Same-date denied preferences take priority over uncertain grants. This conservative evidence rule is an internal policy, not a statement of law. Missing preference evidence remains missing. A later grant must be genuine and supported; the system does not infer one from a name, email or profile link.

A production installation still needs access controls, secure storage and backups, review of overseas disclosure, access and correction procedures, and an incident response process. These are deployment responsibilities beyond checking whether a database field is filled in.
