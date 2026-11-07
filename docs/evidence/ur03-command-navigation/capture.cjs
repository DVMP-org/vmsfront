const { chromium } = require('@playwright/test');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const role={id:'fixture-role',name:'admin',permissions:['*']};
 const user={id:'fixture-user',first_name:'Ada',last_name:'Operator',email_verified:true,is_email_verified:true,admin:{id:'fixture-admin',role}};
 for(const width of [1440,390]){
 const context=await browser.newContext({viewport:{width,height:900},ignoreHTTPSErrors:true});
 await context.addCookies([{name:'auth-token',value:'fixture',domain:'ur03.vmsfront.to',path:'/'}]);
 await context.addInitScript(({user})=>localStorage.setItem('auth-storage',JSON.stringify({state:{token:'fixture',isAuthenticated:true,user},version:0})),{user});
 const page=await context.newPage();
 await page.route('https://ur03.vmsfront.to/**',async route=>{
  const url=new URL(route.request().url());
  const response=await route.fetch({url:'http://127.0.0.1:3018'+url.pathname+url.search,headers:{...route.request().headers(),host:'ur03.vmsfront.to'}});
  await route.fulfill({response});
 });
 await page.route('https://vmscore.to/**',async route=>{
 const path=new URL(route.request().url()).pathname.replace(/\/$/,'');
 const data=path==='/admin/branding/theme/active'?{primary_color:'#343fb2',secondary_color:'#475569'}:(path==='/auth/verify'||path==='/user/me')?user:path==='/organizations/me'?[{id:'fixture-org',slug:'ur03',name:'Harbour Operations'}]:path==='/organizations/ur03'?{id:'fixture-org',slug:'ur03',name:'Harbour Operations'}:path==='/admin/me'?user.admin:{};
 await route.fulfill({status:path==='/admin/dashboard'?500:200,headers:{'access-control-allow-origin':'https://ur03.vmsfront.to','access-control-allow-credentials':'true','access-control-allow-headers':'*'},contentType:'application/json',body:JSON.stringify({data})});
 });
 page.on('pageerror',e=>console.log('PAGEERROR',e.message));
 await page.goto('https://ur03.vmsfront.to/admin/',{waitUntil:'domcontentloaded'});
 await page.waitForTimeout(3000);
 await page.getByRole('button',{name:'Find a page'}).waitFor({timeout:30000});
 await page.getByRole('button',{name:'Find a page'}).focus();
 await page.keyboard.press('Control+k');
 await page.getByRole('combobox').waitFor();
 await page.keyboard.press('ArrowUp');
 const visible=await page.evaluate(()=>{const selected=document.querySelector('[role=option][aria-selected=true]');const list=document.querySelector('[role=listbox]');return selected.getBoundingClientRect().bottom<=list.getBoundingClientRect().bottom+1;});
 if(!visible)throw new Error('Active command did not scroll into view');
 await page.screenshot({path:`docs/evidence/ur03-command-navigation/${width}-navigation.png`,fullPage:true});
 await page.evaluate(()=>document.documentElement.classList.add('dark'));
 await page.screenshot({path:`docs/evidence/ur03-command-navigation/${width}-dark.png`,fullPage:true});
 await page.evaluate(()=>document.documentElement.classList.remove('dark'));
 await page.getByRole('combobox').fill('forbidden');
 await page.getByRole('status').filter({hasText:'No available'}).waitFor();
 await page.screenshot({path:`docs/evidence/ur03-command-navigation/${width}-empty.png`,fullPage:true});
 await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
 const contained=await page.evaluate(()=>document.querySelector('dialog[open]').contains(document.activeElement));
 if(!contained)throw new Error('Focus escaped dialog');
 await page.keyboard.press('Escape');
 if(!(await page.getByRole('button',{name:'Find a page'}).evaluate(e=>e===document.activeElement)))throw new Error('Focus not restored');
 await page.keyboard.press('Control+k');
 await page.getByRole('combobox').fill('roles');
 await page.getByRole('combobox').press('Enter');
 await page.waitForURL(url=>url.pathname.replace(/\/$/,'')==='/admin/admins/roles',{timeout:15000});
 console.log(width,'navigation, empty, keyboard route, trap and restoration passed');
 await context.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
