const fs=require('node:fs'), vm=require('node:vm'), assert=require('node:assert/strict');
const dir=process.cwd()+'/raw/quizzes/lecture01_arch/';
const bank=JSON.parse(fs.readFileSync(dir+'questions.json','utf8'));
const code=fs.readFileSync(dir+'Code.gs','utf8');
const student=fs.readFileSync(dir+'student_test.md','utf8').replace(/\s+/g,' ');
assert.equal(bank.questions.length,15);assert.equal(new Set(bank.questions.map(q=>q.id)).size,15);
assert.equal(new Set(bank.questions.map(q=>q.section)).size,4);
for(const q of bank.questions){
 assert.ok(student.includes(q.prompt.replace(/\s+/g,' ')),q.id+' prompt');
 for(const option of q.options) assert.ok(student.includes(option.replace(/\s+/g,' ')),q.id+' option');
 assert.ok(!student.includes(q.explanation.replace(/\s+/g,' ')),q.id+' no explanation');
}
const props=new Map();let creates=0,releases=0;const items=[];
function item(type){const x={type};for(const prop of ['Title','Required','Points','HelpText','Choices','FeedbackForCorrect','FeedbackForIncorrect'])x['set'+prop]=v=>{if(type==='Text' && prop==='Points') throw new Error('Google rejects explicit zero-point update on this text item');x[prop]=v;return x;};x.createChoice=(value,correct)=>({value,correct});items.push(x);return x;}
const form={getId:()=> 'test-id',getEditUrl:()=> 'https://docs.google.com/forms/d/test-id/edit',getPublishedUrl:()=> 'https://docs.google.com/forms/d/e/respondent-id/viewform'};
for(const prop of ['Title','IsQuiz','Description','CollectEmail','LimitOneResponsePerUser','AllowResponseEdits','PublishingSummary','ShuffleQuestions','ProgressBar','ConfirmationMessage'])form['set'+prop]=v=>{form[prop]=v;return form;};
for(const type of ['Text','SectionHeader','PageBreak','MultipleChoice'])form['add'+type+'Item']=()=>item(type);
const sandbox={console:{log(){}},PropertiesService:{getScriptProperties:()=>({getProperty:k=>props.get(k),setProperty:(k,v)=>props.set(k,v)})},LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){releases++;}})},FormApp:{create:(title,published)=>{creates++;assert.equal(title,bank.title);assert.equal(published,false);return form;},openById:id=>{assert.equal(id,'test-id');return form;},createFeedback:()=>({setText(text){return {build:()=>({text})};}})}};
vm.createContext(sandbox);vm.runInContext(code,sandbox);
assert.deepEqual(JSON.parse(vm.runInContext('JSON.stringify(QUIZ_DATA)',sandbox)),bank);
const links=sandbox.createQuiz();assert.equal(creates,1);assert.equal(releases,1);
const questions=items.filter(i=>i.type==='MultipleChoice');assert.equal(questions.length,15);
questions.forEach((item,i)=>{const q=bank.questions[i];assert.equal(item.Required,true);assert.equal(item.Points,q.points);assert.equal(item.Choices.filter(c=>c.correct).length,1);assert.equal(item.Choices.findIndex(c=>c.correct),q.correct_index);assert.equal(item.FeedbackForCorrect.text,q.explanation);assert.equal(item.FeedbackForIncorrect.text,q.explanation);});
assert.equal(questions.reduce((s,q)=>s+q.Points,0),20);
const grade=answers=>questions.reduce((s,q,i)=>s+(q.Choices[answers[i]].correct?q.Points:0),0);
const right=bank.questions.map(q=>q.correct_index);assert.equal(grade(right),20);const wrongA02=[...right];wrongA02[1]=(wrongA02[1]+1)%4;assert.equal(grade(wrongA02),18);
assert.equal(items.filter(i=>i.type==='PageBreak').length,3);assert.equal(form.IsQuiz,true);assert.equal(form.CollectEmail,false);assert.equal(form.LimitOneResponsePerUser,false);
assert.equal(items.find(i=>i.type==='Text').Required,false);
assert.ok(links.embedHtml.includes('embedded=true'));assert.ok(!links.embedHtml.includes('/edit'));
const count=items.length;sandbox.createQuiz();assert.equal(creates,1);assert.equal(items.length,count);assert.equal(releases,2);
sandbox.FormApp.ItemType={TEXT:'Text'};form.getItems=()=>items;form.getTitle=()=>bank.title;form.getResponses=()=>[];
for(const i of items){i.getType=()=>i.type;i.getTitle=()=>i.Title;}
props.set('MODAI_ARCH_12_FORM_STATUS','building');assert.throws(()=>sandbox.createQuiz(),/not the expected empty quiz/);assert.equal(releases,3);
assert.equal(2*16*4096*8*128*2/2**20,256);
console.log('PASS: bank/student text sync; 15 required questions, 4 sections, correct keys and feedback; grading 20/20 and 18/20; unpublished draft, no duplicate creation, interrupted-build protection, lock release. Google services simulated; no live submission performed.');
assert.throws(()=>sandbox.resumeEmptyDraft(),/not the expected empty quiz/);
items.splice(1);sandbox.resumeEmptyDraft();assert.equal(props.get('MODAI_ARCH_12_FORM_STATUS'),'complete');assert.equal(items.filter(i=>i.type==='MultipleChoice').length,15);const afterRepair=items.length;sandbox.resumeEmptyDraft();assert.equal(items.length,afterRepair);assert.equal(creates,1);
console.log('PASS: repair refuses populated drafts, resumes the known empty draft without creating a new form, and is idempotent.');
