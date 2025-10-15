exports.authorizerHandler = async (event: any) => {
  console.log('Lambda authorizer event:', JSON.stringify(event, null, 2));
  console.log('Environment variables:', Object.keys(process.env));

  // get token from headers
  const authorizationToken = event.headers?.Authorization || event.headers?.authorization;

  // Helper function to generate deny policy
  const generateDenyPolicy = (principalId: string) => {
    return {
      principalId,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: event.methodArn
          }
        ]
      }
    };
  };

  // Helper function to generate allow policy
  const generateAllowPolicy = (principalId: string) => {
    return {
      principalId,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: event.methodArn
          }
        ]
      }
    };
  };

  if (!authorizationToken) {
    console.log('No authorization token provided');
    //401
    throw new Error('Unauthorized');
  }

  try {
    console.log('Authorization token received:', authorizationToken);

    // Extract the token part after 'Basic '
    if (!authorizationToken.startsWith('Basic ')) {
      console.log('Invalid authorization format - must start with Basic');
      //  401
      throw new Error('Unauthorized');
    }

    // Remove 'Basic ' prefix
    const token = authorizationToken.substring(6);
    console.log('Base64 token:', token);

    // Decode token
    const decodedToken = Buffer.from(token, 'base64').toString('utf-8');
    console.log('Decoded token:', decodedToken);

    const [username, password] = decodedToken.split(':');
    console.log('Extracted username:', username, 'password:', password);

    // Check if credentials exist in environment variables
    const envPassword = process.env[username];
    console.log('Environment password for user:', envPassword);

    if (!envPassword || envPassword !== password) {
      console.log('Invalid credentials for user:', username);
      return generateDenyPolicy('user');
    }

    console.log('Authorization successful for user:', username);

    // policy for successful authorization
    const policy = generateAllowPolicy(username);
    console.log('Returning allow policy:', JSON.stringify(policy, null, 2));
    return policy;

  } catch (error: any) {
    console.error('Authorization error:', error.message);
    console.error('Error stack:', error.stack);

    // missing/invalid token 401
    if (error.message === 'Unauthorized') {
      throw new Error('Unauthorized');
    }
    return generateDenyPolicy('user');
  }
};