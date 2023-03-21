CLIENT_ID=

aws cognito-idp sign-up \
        --client-id ${CLIENT_ID} \
        --username "test@test.com" \
        --password "password123" \


POOL_ID=

aws cognito-idp admin-confirm-sign-up \
  --user-pool-id ${POOL_ID} \
  --username "test@test.com"


aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --auth-parameters \
  USERNAME="test@test.com",PASSWORD="password123" \
  --client-id ${CLIENT_ID}
