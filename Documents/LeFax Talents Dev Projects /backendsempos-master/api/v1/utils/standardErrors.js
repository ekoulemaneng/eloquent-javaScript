module.exports = {
    
    error401: { 
        status: 401, 
        details: { 
            code: 'unauthorized_user', 
            message: 'The request has been not executed because valid credentials for the target resource are missing' 
        } 
    },

    error403: { 
        status: 403, 
        details: { 
            code: 'user_forbidden', 
            message: 'The server receives the request but refuses to authorize it because the user does not have permission to access this resource' 
        } 
    },

    error404: { 
        status: 404, 
        details: { 
            code: 'not_found', 
            message: 'The server cannot find the requested resource' 
        } 
    },

    error406: { 
        status: 401, 
        details: { 
            code: 'not_acceptable', 
            message: 'Unable to serve a response that meets the criteria defined in the Accept-Charset and Accept-Language headers' 
        } 
    },

    error415: { 
        status: 415, 
        details: { 
            code: 'unsupported-media-type', 
            message: 'The server refuses the request because the payload format is not supported' 
        } 
    },

    error429: { 
        status: 429, 
        details: { 
            code: 'too_many_requests', 
            message: 'The user has sent too many requests in a given time' 
        } 
    },

    error500: { 
        status: 500, 
        details: { 
            code: 'internal-server-error', 
            message: 'The server has encountered an unexpected problem that prevents it from responding to the request' 
        } 
    },

    errorDefault: { 
        code: 'unexpected_error', 
        message: 'An unexpected error occurred' 
    }
}