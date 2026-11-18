const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const helper = html.split('// PROMPT_BUILDER_START')[1].split('// PROMPT_BUILDER_END')[0];
const sandbox = {};
vm.runInNewContext(helper + ';this.build = buildPrompt;this.validate = validateRules;', sandbox);
const context = { situation:'화재 현장', people:'구급대원', objects:'물품', environment:'어두움', problem:'물품 전달이 어렵다' };
const base = {value:'forward',note:'출발',action:'forward',speed:'40',seconds:'1',port:'1',angle:'90'};
for (const mode of ['voice','hand']) {
  for (const hardware of ['motor','servo']) {
    const rule = {...base,value:mode==='hand'?'ID3':'forward',action:hardware==='servo'?'servo':'forward'};
    assert.equal(sandbox.validate(mode,hardware,[rule]).length,0);
    const text = sandbox.build(context,mode,hardware,[rule]);
    assert.ok(text.includes('stop'));
    assert.ok(text.includes('화재 현장'));
    assert.ok(text.includes('NewLine'));
    assert.ok(text.includes('왼쪽 회전(↶)은 DirectionControl.Clockwise'));
    assert.ok(text.includes('bluetooth 확장이 필요하다'));
    assert.ok(text.includes('control.deviceName()'));
    assert.ok(text.includes('IconNames.Yes'));
    assert.ok(text.includes('IconNames.No'));
    assert.ok(text.includes('aiPonybot.showString(text, column, row, 1)'));
    assert.ok(text.includes('동작 판단용 원문은 자르지 않고 보존'));
    assert.ok(text.includes('같은 ID 반복 수신마다 다시 그리지 않는다'));
    assert.ok(!text.includes('추가 LED/센서 기능은 요청하지 않았으므로'));
    assert.ok(text.includes(mode==='hand'?'1000ms':'한 번만 전송'));
    assert.ok(text.includes(hardware==='servo'?'서보 1번을 90도':'최대 1초'));
  }
}
for (const invalid of ['', 'stop', 'id1', 'ID0', '손바닥', 'ID1\n']) assert.ok(sandbox.validate('hand','motor',[{...base,value:invalid}]).length);
assert.ok(sandbox.validate('voice','motor',[base,base]).length);
assert.ok(sandbox.validate('voice','motor',[{...base,seconds:'NaN'}]).length);
assert.ok(sandbox.validate('voice','motor',[{...base,speed:''}]).length);
assert.ok(sandbox.validate('voice','servo',[{...base,action:'servo',angle:181}]).length);
assert.ok(sandbox.validate('voice','motor',[]).length);
assert.equal(sandbox.validate('voice','motor',[{...base,value:'rescue'}]).length,0);
assert.equal(sandbox.validate('voice','motor',[{...base,value:'1'}]).length,0);
console.log('PASS: four input/hardware combinations, UART contract, duplicate/invalid values, numeric limits');

