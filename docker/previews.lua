local _M = {}
local cjson = require "cjson"
local ustring = require "ustring"
local str = require "resty.string"
local hmac = require "hmac"

local IMGPROXY_KEY = os.getenv("IMGPROXY_KEY") or ''
local IMGPROXY_SALT = os.getenv("IMGPROXY_SALT") or ''

function _M.clean(input)
    return ngx.re.gsub(input, '"', '')
end

function _M.fromhex(str)
    return (str:gsub('..', function (cc)
        return string.char(tonumber(cc, 16))
    end))
end

function _M.getImgproxyURL(input)
    if IMGPROXY_KEY ~= '' and IMGPROXY_SALT ~= '' then
        local KEY = _M.fromhex(IMGPROXY_KEY)
        local SALT = _M.fromhex(IMGPROXY_SALT)

        local hmac_sha256 = hmac:new(KEY, hmac.ALGOS.SHA256)
        hmac_sha256:update(SALT)
        hmac_sha256:update(input)

        local mac = hmac_sha256:final()  -- binary mac
        local base64 = ngx.encode_base64(mac)

        local result = ngx.re.gsub(base64, "=+$", "")
        result = ngx.re.gsub(result, '\\+', "-")
        result = ngx.re.gsub(result, '/', "_")

        return '/' .. result .. input
    end
    return input
end

function _M.findProfileDetails(search)
    local res = ngx.location.capture('/teztok/', {
        method = ngx.HTTP_POST,
        body = '{"query":"query findProfileDetails {teia_users(where: {_or: [{user_address: {_eq: \\"' .. search .. '\\"}},{name: {_eq: \\"' .. search .. '\\"}},]},limit: 1) {user_address name metadata {data}}}"}',
    })
    -- ngx.log(ngx.ERR, "findProfileDetails: ", res.body)
    local data = table.remove(cjson.decode(res.body)['data']['teia_users'])
    local profile = {}
    profile['id'] = _M.clean(data['user_address'])
    profile['artist_address'] = _M.clean(data['user_address'])
    profile['name'] = _M.clean(data['name'])
    profile['description'] = _M.clean(data['metadata']['data']['description'])
    profile['image'] = _M.clean(data['metadata']['data']['identicon'])
    profile['type'] = 'profile'
    return profile
end

function _M.findTokenDetails(search)
    local res = ngx.location.capture('/teztok/', {
        method = ngx.HTTP_POST,
        body = '{"query":"query findTokenDetails {  token: tokens_by_pk(token_id: \\"'.. search .. '\\", fa2_address: \\"KT1RJ6PbjHpwc3M5rw5s2Nbmefwbuwbdxton\\") { token_id name description display_uri artifact_uri artist_address mime_type teia_meta { preview_uri }}}"}',
    })
    -- ngx.log(ngx.ERR, "findTokenDetails: ", res.body)
    data = cjson.decode(res.body)['data']['token']
    local token = {}
    token['id'] = _M.clean(data['token_id'])
    token['name'] = _M.clean(data['name'])
    token['description'] = _M.clean(data['description'])
    token['image'] = (data['display_uri'] ~= ngx.null and _M.clean(data['display_uri']) or _M.clean(data['artifact_uri']))
    token['artist_address'] = data['artist_address']
    token['mime_type'] = data['mime_type']
    token['preview_uri'] = data['teia_meta']['preview_uri']
    token['type'] = 'token'
    return token
end

function _M.injectOpenGraphTags(body, info)
    -- cleanup old meta tags
    body = ngx.re.gsub(body, '\n+', '', 'jom') -- I cannot be bothered to do multiline regex stuff
    body = ngx.re.gsub(body, '<meta.*?property="og.*?/>', '', 'jo')
    body = ngx.re.gsub(body, '<meta.*?name="twitter.*?/>', '', 'jo')
    body = ngx.re.gsub(body, '<!-- OPEN GRAPH -->.*?/>', '', 'jo')

    local url = ngx.var.scheme .. '://' .. ngx.var.host .. ngx.var.request_uri
    local imgproxy_url = os.getenv('VITE_IMGPROXY')

    local image = info['image']
    if info['preview_uri'] then
        image = imgproxy_url .. info['preview_uri']
    end
    if IMGPROXY_KEY ~= '' and IMGPROXY_SALT ~= '' and (info['mime_type'] == 'video/mp4' or info['mime_type'] == 'image/gif') then
        image = imgproxy_url .. _M.getImgproxyURL('/rs:fit:320:0:false/format:gif/plain/' .. ngx.re.sub(info['image'], 'ipfs://', ''))
    end

    local openGraphTags = '' ..
        '<meta name="description" content="' .. info['description'] .. '" />' ..
        '<meta property="og:type" content="website" />' ..
        '<meta property="og:title" content="' .. info['name'] .. '" />' ..
        '<meta property="og:description" content="' .. info['description'] .. '" />' ..
        '<meta property="og:image" content="' .. info['image'] .. '" />' ..
        '<meta property="og:url" content="' .. url .. '" />' ..
        '<meta name="twitter:card" content="summary_large_image" />' ..
        '<meta name="twitter:creator" content="@TeiaCommunity" />' ..
        '<meta name="twitter:title" content="' .. info['name'] .. '" />' ..
        '<meta name="twitter:description" content="' .. info['description'] .. '" />' ..
        '<meta name="twitter:image" content="' .. info['image'] .. '" />' ..
        '<meta property="fc:frame" content="vNext"/>' ..
        '<meta property="fc:frame:image" content="' .. image .. '"/>' ..
        '<meta property="fc:frame:image:aspect_ratio" content="1:1"/>'

    if info['type'] == 'token' then
        openGraphTags = openGraphTags ..
        '<meta name="fc:frame:button:1" content="Collect on Teia"/>' ..
        '<meta name="fc:frame:button:1:action" content="link"/>' ..
        '<meta name="fc:frame:button:1:target" content="' .. url .. '"/>' ..
        '<meta name="fc:frame:button:2" content="Visit artist profile"/>' ..
        '<meta name="fc:frame:button:2:action" content="link"/>' ..
        '<meta name="fc:frame:button:2:target" content="' .. ngx.var.scheme .. '://' .. ngx.var.host .. '/tz/' .. info['artist_address'] .. '"/>'
    else
        openGraphTags = openGraphTags ..
        '<meta name="fc:frame:button:1" content="Visit artist profile"/>' ..
        '<meta name="fc:frame:button:1:action" content="link"/>' ..
        '<meta name="fc:frame:button:1:target" content="' .. ngx.var.scheme .. '://' .. ngx.var.host .. '/tz/' .. info['artist_address'] .. '"/>'
    end
    
    openGraphTags = ngx.re.gsub(openGraphTags, 'ipfs://', os.getenv('IPFS_GATEWAY') or 'https://nftstorage.link/ipfs/')
    local ok, content = pcall(ustring.gsub, body, '<head>', '<head>' .. openGraphTags)
    if ok and content then
        return content
    end
    return body
end

return _M
