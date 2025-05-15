// copyrightmodaltext.js
export const copyrightModalText = {
    overview: `
        <p>Copyright laws are over complex and conflicting - which is why in most cases, is handled by a case-by-case basis. In order for NFT Copyright to be admissible in courts, it's important for both Creators and Owners to understand the scope of what these Agreements can and cannot do.</p>
        <p>Copyright clauses are normally legally defined with traditional contracts and may involve agreements that specify the geographical areas, specific platforms, and duration for which the broadcasting is allowed. The "scope" of NFT mints are global contracts here are currently set to "global", "in perpetuity", and are "unlimited". They are, in essence, a "lump sum" estimation of how much the rights might be worth in total for the Work's entire life cycle. (Exclusivity is possible, and rights are also transferable based on ownership.)</p>
        <ul>
            <li><strong>Geographical Coverage:</strong> The rights are set globally, allowing for usage across all regions without any restrictions.</li>
            <li><strong>Duration of Rights:</strong> Rights are granted in perpetuity, meaning there is no expiration on the privileges and permissions granted to Owners after purchase.</li>
            <li><strong>Frequency of Rights:</strong> Rights are unlimited, not restricted by the number of broadcasts or platforms.</li>
            <li><strong>Exclusivity:</strong> Exclusive rights Agreements (privileges granted exclusive to one individual or entity and no one else), are possible using the number of Editions owned as a mechanism to facilitate these types of arrangements. (By default, all rights bestowed upon by the Creator are non-exclusive.)</li>
            <li><strong>Transferability:</strong> Rights are transferable because they are defined by the condition of ownership, allowing rights and associated privileges to be passed to others, unless stated otherwise.</li>
            <li><strong>Royalties:</strong> Royalties upon secondary sales still apply during transfers of ownership, which allows for Creators to earn "passive income", similar to deals that occur in traditional arts/entertainment industries.</li>
        </ul>
        <p>Note that some digital mediums (e.g. software, websites, video games) often fall into several categories, depending on how it's use. If you want a "permissive" contract, choose as many as applicable. If you want more granularity, think about use-cases and scope them as necessary. (e.g. for video games, reproduction rights will allow the developer to sell assets like art and music directly, whereas broadcasting rights will only allow to "use" them in-game.)
        <p>If geography, timelines (i.e. expiration dates), or frequency of usage (e.g. each Owner is only allowed to make X copies) is of importance, Creators can add those details in the Addendum sections to scope the Agreement as necessary.</p>
        <p>In all cases, the written text in this document will take precident over any data or metadata displays as the authoritative permissions for the Work, applied to both the Creator(s) and Owner(s), with the statements in the Addendums having the ability to overrule or nullify statements in the auto-generated portions of the document itself in cases of conflicts or inconsistencies. (Though it is recommended that you don't create contradictions in the document itself to avoid misunderstandings or misinterpretations.)</p>
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
        <p>Public domain release is often irrevocable, meaning once a work is released to the public domain, the creator cannot reclaim the rights. Therefore, it's crucial for Creators to carefully consider the implications before making such a decision, especially since it can be easily referenced on the blockchain itself. ("Announcements" made on social media or other privately-owned platforms may or may not be admissible as a declaration so it may be risky to assume so.</p>
        <p>This option can be particularly beneficial for educational, cultural, or philanthropic purposes, contributing to the broader public good by freely sharing creative works.</p>
        `,
    requireAttribution: `
        <p>This is simply a requirement that whenever the work is displayed in public settings (which includes broadcasts, events, social media posts, etc.) that the Owner of the work is required to give attribution to the original Creator(s) in some way, shape, or form.</p>
        <p>Many curators, content creators, and fans will do this out of courtesy to the artist, but there are times (like logos) where attribution may not be necessary, or even undesirable. Leaving this section blank leaves it up to the Owner as to what they want to do, but it's generally a good idea to make explicit what the usage rights are, if the artist has a preference for how they want their works used in public contexts.</p>
        <p>If you want more granularity in the way attributions are done, you may want to consider using the Addendum portions of the Custom License or reference Creative Commons licenses to get an idea of how these clauses are applied in practice. (Note: Once a work goes to Public Domain, attributions are no longer required.)</p>
        `,
    rightsAreTransferable: `
        <p>When rights are transferable, the Owner(s) of the Work are granted the ability to pass on their rights and privileges to subsequent Owners upon a sale. (i.e. "Secondary Sales") This transferability includes all forms of public display, reproduction, and sale, ensuring that rights can dynamically move within the marketplace while still respecting the original agreements set forth by the Creator(s).</p>
        <p>Transferable rights are particularly valuable in dynamic markets and industries where ownership frequently changes hands. They allow for continued use and enjoyment of the Work across different owners and contexts. However, it's important for each Owner to understand that the transfer of these rights must still adhere to the terms of the original contract, particularly concerning attribution and royalty obligations.</p>
        <p>If rights are *not* transferable, the original Owner (usually the Creator) retains exclusive control over the use of the Work, and any attempt to transfer these rights without explicit approval from the Creator is void. This setup ensures that the Creator can maintain a closer relationship with the usage of their Work, limiting the potential for unauthorized uses or dilution of the Work’s value in contexts they did not consent to.</p>
        <p>In either case, Creators and Owners should clearly understand the terms of transferability and its implications since it potentially has long-term ramifications, especially when there is no expiration date attached to each clause.</p>
        `,
    expirationDate: `
        <p>This is the date where all rights given to Owner(s) upon the ownership of each edition/license expires, effectively returning the privledges and rights granted through the Work back to the Creator.</p>
        <p>In professional contexts, expiration dates are typically set on a case-to-case basis (when an artist signs a "deal" with a label or company these details come into play), but if the Creator wants to create a blanket policy for their rights to be effective only during a limited time period, this option can be used to set a standard for all editions that apply to all Owners at once.</p>
    `,
    customUri: `
        <p>The Custom URI feature serves two important functions for creators:</p>
        
        <p><strong>1. External Reference:</strong><br>
        - Link to additional terms, restrictions, or declarations for the Work
        - Provide supplementary documentation or metadata
        - Reference creator's canonical information or portfolio</p>
        
        <p><strong>2. Retroactive Application:</strong><br>
        - Point to a previous work by the same creator
        - Apply current license terms to the referenced work
        - Must be verifiable through wallet address ownership</p>
        
        <p><strong>Important Considerations:</strong></p>
        <ul>
        <li>For standard web links (http://, https://):
          <ul>
            <li>- The URI reference is permanent, but destination content may change</li>
            <li>- Consider carefully if changeable content aligns with your intentions</li>
            <li>- Best for dynamic information that may need updates</li>
          </ul>
        </li>
        <li>For decentralized storage (ipfs://, etc.):
          <ul>
            <li>- Content is immutable and permanently stored</li>
            <li>- Ideal for fixed terms or historical references</li>
            <li>- Recommended for legal documents and permanent declarations</li>
          </ul>
        </li>
        </ul>
        
        <p><strong>Verification Requirements:</strong><br>
        When using this feature for retroactive application, creators must be able to prove ownership of both the current and referenced works through their wallet addresses. This typically requires maintaining access to both wallet addresses and being able to sign transactions or messages that verify ownership.</p>`
};
