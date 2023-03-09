local _M = {}
local cjson = require "cjson"
local ustring = require "ustring"

function _M.clean(input)
    return ngx.re.gsub(input, '"', '')
end

function _M.findProfileDetails(search)
    local res = ngx.location.capture('/teztok/v1/graphql', {
        method = ngx.HTTP_POST,
        body = '{"query":"query findProfileDetails {teia_users(where: {_or: [{user_address: {_eq: \\"' .. search .. '\\"}},{name: {_eq: \\"' .. search .. '\\"}},]},limit: 1) {user_address name metadata {data}}}"}',
    })
    -- ngx.log(ngx.ERR, "findProfileDetails: ", res.body)
    local data = table.remove(cjson.decode(res.body)['data']['teia_users'])
    local profile = {}
    profile['id'] = _M.clean(data['user_address'])
    profile['name'] = _M.clean(data['name'])
    profile['description'] = _M.clean(data['metadata']['data']['description'])
    profile['image'] = _M.clean(data['metadata']['data']['identicon'])
    return profile
end

function _M.findTokenDetails(search)
    local res = ngx.location.capture('/teztok/v1/graphql', {
        method = ngx.HTTP_POST,
        body = '{"query":"query findTokenDetails {  token: tokens_by_pk(token_id: \\"'.. search .. '\\", fa2_address: \\"KT1RJ6PbjHpwc3M5rw5s2Nbmefwbuwbdxton\\") { token_id name description display_uri artifact_uri}}"}',
    })
    -- ngx.log(ngx.ERR, "findTokenDetails: ", res.body)
    data = cjson.decode(res.body)['data']['token']
    local token = {}
    token['id'] = _M.clean(data['token_id'])
    token['name'] = _M.clean(data['name'])
    token['description'] = _M.clean(data['description'])
    token['image'] = (data['display_uri'] ~= ngx.null and _M.clean(data['display_uri']) or _M.clean(data['artifact_uri']))
    return token
end

function _M.injectOpenGraphTags(body, info)
    local newBody = body;

    -- cleanup old meta tags
    body = ngx.re.gsub(body, '<meta.*?property="og.*?/>', '', 'm')
    body = ngx.re.gsub(body, '<meta.*?name="twitter.*?/>', '', 'm')

    local url = ngx.var.scheme .. '://' .. ngx.var.host .. ngx.var.request_uri

    local openGraphTags = '' ..
        '<meta property="og:type" content="website" />' ..
        '<meta property="og:title" content="' .. info['name'] .. '" />' ..
        '<meta property="og:description" content="' .. info['description'] .. '" />' ..
        '<meta property="og:image" content="' .. info['image'] .. '" />' ..
        '<meta property="og:url" content="' .. url .. '" />' ..
        '<meta name="twitter:card" content="summary_large_image" />' ..
        '<meta name="twitter:creator" content="@TeiaCommunity" />' ..
        '<meta name="twitter:title" content="' .. info['name'] .. '" />' ..
        '<meta name="twitter:description" content="' .. info['description'] .. '" />' ..
        '<meta name="twitter:image" content="' .. info['image'] .. '" />'
    
    openGraphTags = ngx.re.gsub(openGraphTags, 'ipfs://', 'https://cache.teia.rocks/ipfs/')
    local ok, content = pcall(ustring.gsub, body, '<head>', '<head>' .. openGraphTags)
    if ok and content then
        return content
    end
    return body
end

return _M
