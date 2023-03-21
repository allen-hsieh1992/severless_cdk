CLIENT_ID=65fuq8s919ldvmoijbn36khddk

aws cognito-idp sign-up \
        --client-id ${CLIENT_ID} \
        --username "test@test.com" \
        --password "password123" \


POOL_ID=ap-northeast-1_OvRn2NEnV	

aws cognito-idp admin-confirm-sign-up \
  --user-pool-id ${POOL_ID} \
  --username "test@test.com"


aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --auth-parameters \
  USERNAME="test@test.com",PASSWORD="password123" \
  --client-id ${CLIENT_ID}
