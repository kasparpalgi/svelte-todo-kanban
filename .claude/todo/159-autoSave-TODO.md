> Run with: Sonnet 4.6 / low

# Auto save

## Original Requirement

[NEVER REMOVE]

Sonnet 4.6 / medium
Make when the card is open to auto-save the card when there's changes made to the card.

Also, one session ended like this:
One thing I did not do: apply the new migration to Hasura. hasura/config.yaml points at a remote instance (todzz.admin.servicehost.io), so I left hasura migrate apply --database-name default for you to run explicitly rather than pushing a schema change to what looks like your live server.

Remember to always use Hasura CLI to first pull latest metadata from the server and then make all up to date in the hosted Hasura.
