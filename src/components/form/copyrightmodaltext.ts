// copyrightmodaltext.js
export const copyrightModalText = {
    overview: `
        <p>Copyright laws are over complex and conflicting - which is why in most cases, is handled by a case-by-case basis. In order for NFT Copyright to be admissible in courts, it's important for both Creators and Owners to understand the scope of what these Agreements can and cannot do.</p>
        <p>Copyright clauses are normally legally defined with traditional contracts and may involve agreements that specify the geographical areas, specific platforms, and duration for which the broadcasting is allowed. The "scope" of NFT mints are global contracts here are currently set to "global", "in perpetuity", and are "unlimited". They are, in essence, a "lump sum" estimation of how much the rights might be worth in total for the Work's entire life cycle. (Exclusivity is possible, and rights are also transferable based on ownership.)</p>
        <ul>
            <li><strong>Geographical Coverage:</strong> The rights are set globally, allowing for usage across all regions without any restrictions.</li>
            <li><strong>Duration of Rights:</strong> Rights are granted in perpetuity, meaning there is no expiration on the privileges and permissions granted to Owners after purchase.</li>
            <li><strong>Frequency of Rights:</strong> Rights are unlimited, not restricted by the number of broadcasts or platforms.</li>
            <li><strong>Exclusivity:</strong> Exclusive rights Agreements (priviledges granted exclusive to one individual or entity and no one else), are possible using the number of Editions owned as a mechanism to facilitate these types of arrangements. (By default, all rights bestowed upon by the Creator are non-exclusive.)</li>
            <li><strong>Transferability:</strong> Rights are transferable because they are defined by the condition of ownership, allowing rights and associated privileges to be passed to others.</li>
            <li><strong>Royalties:</strong> Royalties upon secondary sales still apply during transfers of ownership, which allows for Creators to earn "passive income", similar to deals that occur in traditional arts/entertainment industries.</li>
        </ul>
        <p>Note that some digital mediums (e.g. software, websites, video games) often fall into several categories, depending on how it's use. If you want a "permissive" contract, choose as many as applicable. If you want more granularity, think about use-cases and scope them as necessary. (e.g. for video games, reproduction rights will allow the developer to sell assets like art and music directly, whereas broadcasting rights will only allow to "use" them in-game.)
        <p>If geography, timelines (i.e. expiration dates), or frequency of usage (e.g. each Owner is only allowed to make X copies) is of importance, Creators can add those details in the Addendum sections to scope the Agreement as necessary.</p>
    `,
    reproduce: `
        <p>This right allows the Owner of the Work to make direct copies of the work, for both commercial and non-commercial purposes.</p>
        <p>This applies to both digital and physical reproductions - prints, books and publications, merchandise, digital assets (e.g. for use in video games and software applications), educational use, and so on.</p>
        <p>For code-based works (e.g. application/x-directory), if you have your Work stored on a public repository, be careful not to create contradictions or conflicts with your licenses there and here, or it may lead to issues later that may be difficult to untangle.</p>
        <p>Reproduction rights are typically used for direct sales of the artwork, "as is". In music, record/album sales are typically done through reproduction rights, whereas the permissions to use in playback through broadcasting rights. Add more specificity to the Addendum sections if more granularity is required.</p>
        `,
    broadcast: `
        <p>This right allows the holder to broadcast the work to the public, across a variety of media platforms, both traditional and digital, for both commercial and non-commercial purposes.</p>
        <p>For traditional media, this includes the airing of works on television and radio, encompassing both entertainment and informational content. It also covers the broadcasting of live events such as concerts and sports.</p>
        <p>In the digital realm, the right extends to online streaming platforms, enabling the work to be shared globally. It also includes the use of social media platforms for live streaming events, sharing video clips, or hosting webinars and podcasts.</p>
        <p>Note that NFT ecosystems currently do not support tracking of plays, views, or interactions (for gaming, etc.) - yet. When these features eventually become integrated with on-chain ledgers, more options for Agreement types will open up for both Creators and Owners alike.</p>
        <p>If you're not sure how to set the initial price of license sales, it is recommended that you start low and let secondary sales determine an estimate for demand - Creators will still get paid through the royalties mechanism, which helps to mitigate some of the risk.</p>
        `,
    publicDisplay: `
        <p>This right allows the holder to display the work publicly, across various venues and platforms, encompassing both physical and digital displays.</p>
        <p>Physical displays can include exhibitions in art galleries, museums, or public spaces where artworks are shown to the public. It also covers the use of works in public areas like billboards, digital signage, and displays in commercial establishments like stores or restaurants.</p>
        <p>Digitally, this right extends to the display of works on websites, digital galleries, or other online platforms where the public can view them. This includes the use of images, videos, or other digital content on platforms intended for wide public reach.</p>
        <p>The public display rights are outlined in legal agreements that specify the scope of where and how the work can be displayed, and may include restrictions based on location, duration, or specific contexts. These rights are typically non-exclusive but can be negotiated depending on the creator's preferences and the nature of the display.</p>
        <p>As with other rights, the right to public display is transferable, allowing the holder to grant permissions to others under agreed terms.</p>
        <p>Note that there may be cases where reproduction and public display rights overlap - if more granularity is required, the Creator may consider specifying the scope (e.g. displays in museums are allowed, websites are not allowed) to avoid confusion.</p>
        `,    
    createDerivativeWorks: `
        <p>This right allows the holder to make derivative works based on the original, for both commercial and non-commercial purposes. This includes modifications, adaptations, and new creations inspired by the original work and is often an Agreement between the Creator and other Creator(s) who are interested in using ideas or concepts from previously created Works.</p>
        <p>Derivative works can range from literary adaptations, such as turning a novel into a screenplay or a children's book, to artistic transformations, such as creating a sculpture based on a painting. It also includes technological adaptations like developing a video game based on a film or creating augmented reality experiences based on traditional media.</p>
        <p>In the digital domain, this right extends to remixing songs, re-editing videos for different platforms, or using existing software code to develop new applications.</p>
        <p>The agreements for derivative works specify the extent of modification allowed and may include limitations to ensure the original creator's vision and intellectual property are respected. These rights are typically negotiated on a case-by-case basis and can be exclusive or non-exclusive, depending on the agreement between the original creator and the rights holder.</p>
        <p>As with other intellectual property rights, the right to create derivative works is transferable. If the Creator wants to set limits or how their work is used by others, they may also choose to specify it in the Addendum section(s) as well.</p>
        `,
    exclusiveRights: `
        <p>Most Agreements will default to "No Exclusive Rights", but the Edition number system allows for Creators to create conditions with their Work that allows them to give exclusive rights to one individual or entity, if desired. (Especially if the Creator is concerned about how the Work will be used or represented by "unauthorized" dealers.)</p>
        <ul>
            <li><strong>Majority Share:</strong> Ownership of more than 50% of the editions confers exclusive rights to the owner.</li>
            <li><strong>Super-Majority Share:</strong> Ownership of 66.667% or more (approximately two-thirds) of the editions confers enhanced exclusive rights.</li>
            <li><strong>Rights Affected:</strong> The exclusive rights may include reproduction, broadcasting, public display, and creation of derivative works, depending on the percentage of ownership.</li>
            <li><strong>Transferability:</strong> These exclusive rights are transferable along with the ownership of the NFTs, which may cause certain rights and clauses to become "active". (A collector may decide to buy out the Editions from the other Owners out there, for example.) Rights, privledges, and permissions granted in this way is effective immediately after the transaction that triggered that condition to occur.</li>
            <li><strong>Retention of Creator's Rights:</strong> Despite the transfer or assignment of exclusive rights, creators may retain certain rights under specified conditions.</li>
        </ul>
        <p>Note: If you're unsure if you may or may not want the option to formulate exclusive deals for your Work, one option is to set it to majority share, then release 49% or less Editions to the public, which allows Creators to continue their sales while also keeping the option open in the future.</p>
        `,
    retainCreatorRights: `
        <p>This right allows Creators to retain all permissions, privledges, rights, even when exclusive rights are granted to another party. (The original definition of "selling out" actually comes from the act of Creators losing control over their own work, in exchange for money, which is something that can still happen today.)</p>
        <p>In most cases, it is recommended to keep this option checked, unless there is a specific reason to do otherwise. Some companies prefer "taking over" the management of the Work, or do partial allocations of rights (e.g. the Creator retains it for personal/educational use, whereas the company focuses on commercial, etc.) but that type of granularity is rare, especially with NFTs.</p>
        `,
    releasePublicDomain: `
        <p>This clause allows the work to be released to the public domain, effectively removing all copyright restrictions associated with it.</p>
        <p>By releasing the work to the public domain, the creator permits anyone to use, modify, and distribute the work without needing to seek permission or pay royalties. This can be a strategic decision for creators who wish to maximize the work's exposure and accessibility.</p>
        <p>Public domain release is often irrevocable, meaning once a work is released to the public domain, the creator cannot reclaim the rights. Therefore, it's crucial for Creators to carefully consider the implications before making such a decision, especially since it can be easily referenced on the blockchain itself. ("Announcements" made on social media or other privately-owned platforms often do not constitute</p>
        <p>This option can be particularly beneficial for educational, cultural, or philanthropic purposes, contributing to the broader public good by freely sharing creative works.</p>
        `,
    customUri: `
        <p>This feature allows creators to set a custom URI/URL for additional resources or information related to the NFT.</p>
        <p>The custom URI can link to a variety of content, such as detailed metadata, licensing information, or the creator's personal website.</p>
        <p>Note that the reference to the URI itself may be permanent (a link to someone's website, for example), but the destination itself may be editable, so unless modularity is what is needed, treat HTTP-based Custom URIs. (Destination links could be edited, or disappear.)</p>
        <p>Custom URIs can be made fully decentralized by using IPFS CIDs (hashes) or other decentralized storage systems, for full immutability.</p>`
};
