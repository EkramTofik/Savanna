# Six-slide pitch outline

These drafts describe repository behavior and known limitations, not external impact claims.

1. **Access to learning media**
   - Enkopa is a browser-based accessibility prototype for lesson video and career content.
   - It embeds into the existing Savanna course page.
2. **Learner controls**
   - Player includes English/Amharic interface switching, captions, transcript, keyboard shortcuts, and a data-saver option.
   - Demonstration lessons L-102/L-103 currently share one 120-second media fixture.
3. **Low-connectivity path**
   - Lesson assets can be saved in browser storage and replayed after the browser goes offline.
   - Current fixture pack is 2,128,323 bytes; it is not a ≤1 MB pack.
4. **Bilingual interaction**
   - A rule-based Q&A answers a small set of English and Amharic questions from the lesson fixture.
   - Automated fixtures pass; native-speaker review is still needed.
5. **Honest accessibility states**
   - The player handles missing AD/sign media and does not enable either for L-102/L-103.
   - The sample AD and sign files are test/demo fixtures, not approved recordings.
6. **What comes next**
   - Confirm media rights, complete native Amharic review, commission real AD and Ethiopian Sign Language recordings, and deploy/smoke-test with the team’s production settings.
