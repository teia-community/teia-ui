import React from 'react';
import Markdown from 'markdown-to-jsx';
import { Container, Padding } from '../../layout';
const axios = require('axios')

export const MD = ({
    artifactUri
}) => {

    const [content, setContent] = React.useState('')

    React.useEffect(() => {
        let artifactHash = artifactUri.split('/ipfs/')[1]
        axios.get(`https://cloudflare-ipfs.com/ipfs/${ artifactHash }`)
            .then(res => {
                console.log(res)
                setContent(res.data)
            })
    }, [artifactUri])

    return (
        <div>
            <Container>
                <Padding>                    
                <Markdown>
                    {content}
                </Markdown>
                </Padding>
            </Container>
        </div>
    )
}