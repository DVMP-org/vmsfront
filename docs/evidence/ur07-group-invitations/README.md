# Group invitation evidence

The reusable Workspace invitation composer now supports a primary visitor plus
additional guests in one authorization.

The local `lvh.me` browser run submitted a two-person invitation against the
canonical workspace API. The returned invitation displayed both guest names
under one code, access window and approval status. The focused automated tests
also cover adding and removing guests and reject a group when an added guest
has no name.

Evidence:

- `group-composer.png`
