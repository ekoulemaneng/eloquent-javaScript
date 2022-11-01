const nodeMailer = require('nodemailer')
const { mailSenderHost, mailSenderPort, mailSenderSecure, senderEmailAccount, senderEmailPassword } = require('../../../config')

const emailConfig = {
    host: mailSenderHost,
    port: mailSenderPort,
    secure: mailSenderSecure, // True for port = 465
    auth: {
        user: senderEmailAccount,
        pass: senderEmailPassword
    }
}

const adminEmailVerification = async (email) => {
    try {
        const transporter = nodeMailer.createTransport(emailConfig)
        const infos = await transporter.sendMail({
            from: '"Onebaz" ' + senderEmailAccount,
            to: email,
            subject: 'Tenant Account Creation Processing',
            text: `You are going to create a tenant account.`,
            html: `<html>
                    <body>
                        <p>You are going to create a tenant account.</p>
                    </body>
                   </html>`
        })
        if (infos.accepted.includes(email)) {
            console.log('Admin verification email sent')
            return true
        }
        console.log('Admin verification email not sent')
        return false
    } 
    catch (error) {
        console.error(error)    
    }
}

const adminAuthenticationEmail = async (email, password, token) => {
    try {
        const transporter = nodeMailer.createTransport(emailConfig)
        const infos = await transporter.sendMail({
            from: '"Onebaz" ' + senderEmailAccount,
            to: email,
            subject: 'Email Authentication',
            text: `Credentials: \n
                   Email: ${email} \n
                   Password: ${password} \n
                   Token: ${token} \n
                   Email Authentication Url Link: \n
                   Email Authentication Url Link: https://www.onebaz.com/admins/email/authenticate/${token}`,
            html: `<html>
                    <body>
                        <h1>Credentials</h1>
                        <p>Email: ${email}</p>
                        <p>Password: ${password}</p>
                        <p>Token: ${token}</p>
                        <p><a href="https://www.onebaz.com/admins/email/authenticate/${token}"><strong>Email Authentication Url Link</strong></a></p>
                    </body>
                   </html>`
        })
        if (infos.accepted.includes(email)) {
            console.log('Admin authentication email sent')
            return true
        }
        console.log('Admin authentication email not sent')
        return false
        
    } 
    catch (error) {
        console.error(error)
    }
}

const resetAdminPasswordEmail = async (email, token) => {
    try {
        const transporter = nodeMailer.createTransport(emailConfig)
        const infos = await transporter.sendMail({
            from: '"Onebaz" ' + senderEmailAccount,
            to: email,
            subject: 'Reset Password',
            text: `Token: ${token} \n
                   Reset Password Url Link: https://www.onebaz.com/admins/reset-password/${token}`,
            html: `<html>
                    <body>
                        <p>Token: ${token}</p>
                        <p><a href="https://www.onebaz.com/admins/reset-password/${token}"><strong>Reset Password Url Link</strong></a></p>
                    </body>
                   </html>`
        })
        if (infos.accepted.includes(email)) {
            console.log('Admin reset-password email sent')
            return true
        }
        console.log('Admin reset-password email not sent')
        return false
        
    } 
    catch (error) {
        console.error(error)
    }
}

const tenantEmailVerification = async (email) => {
    try {
        const transporter = nodeMailer.createTransport(emailConfig)
        const infos = await transporter.sendMail({
            from: '"Onebaz" ' + senderEmailAccount,
            to: email,
            subject: 'Tenant Account Creation Processing',
            text: `You are going to create a tenant account.`,
            html: `<html>
                    <body>
                        <p>You are going to create a tenant account.</p>
                    </body>
                   </html>`
        })
        if (infos.accepted.includes(email)) {
            console.log('Tenant verification email sent')
            return true
        }
        console.log('Tenant verification email not sent')
        return false
    } 
    catch (error) {
        console.error(error)    
    }
}

const tenantUserEmailVerification = async (email) => {
    try {
        const transporter = nodeMailer.createTransport(emailConfig)
        const infos = await transporter.sendMail({
            from: '"Onebaz" ' + senderEmailAccount,
            to: email,
            subject: 'User Account Creation Processing',
            text: `You are going to create a user account.`,
            html: `<html>
                    <body>
                        <p>You are going to create a user account.</p>
                    </body>
                   </html>`
        })
        if (infos.accepted.includes(email)) {
            console.log('Tenant-user verification email sent')
            return true
        }
        console.log('Tenant-user verification email not sent')
        return false
    } 
    catch (error) {
        console.error(error)    
    }
}

const tenantUserAuthenticationEmail = async (subdomain, email, password, token) => {
    try {
        const transporter = nodeMailer.createTransport(emailConfig)
        const infos = await transporter.sendMail({
            from: '"Onebaz" ' + senderEmailAccount,
            to: email,
            subject: 'Email Authentication',
            text: `Credentials: \n
                   Email: ${email} \n
                   Password: ${password} \n
                   Email Authentication Url Link: \n
                   https://${subdomain}.onebaz.com/users/email/authenticate/${token}`,
            html: `<html>
                    <body>
                        <h1>Credentials</h1>
                        <p>Email: ${email}</p>
                        <p>Password: ${password}</p>
                        <h1>Email Authentication Url Link</h1>
                        <p><a href="https://${subdomain}.onebaz.com/users/email/authenticate/${token}"><strong>Email Authentication Url Link</strong></a></p>
                    </body>
                   </html>`
        })
        if (infos.accepted.includes(email)) {
            console.log('Tenant-user authentication email sent')
            return true
        }
        console.log('Tenant-user authentication email not sent')
        return false
    } 
    catch (error) {
        console.error(error)
    }
}

const resetTenantUserPasswordEmail = async (subdomain, email, token) => {
    try {
        const transporter = nodeMailer.createTransport(emailConfig)
        const infos = await transporter.sendMail({
            from: '"Sempos" ' + senderEmailAccount,
            to: email,
            subject: 'Reset Password',
            text: `Reset Password Url Link: https://${subdomain}.onebaz.com/api/v1/users/reset-password/${token}`,
            html: `<html>
                    <body>
                        <p><a href="https://${subdomain}.onebaz.com/api/v1/users/reset-password/${token}"><strong>Reset Password Url Link</strong></a></p>
                    </body>
                   </html>`
        })
        if (infos.accepted.includes(email)) {
            console.log('Reset tenant-user password email sent')
            return true
        }
        console.log('Reset tenant-user password email not sent')
        return false   
    } 
    catch (error) {
        console.error(error)
    }
}

const employeeCredentialsEmail = async (subdomain,firstname,lastname,email, password) => {
    try {
        const transporter = nodeMailer.createTransport(emailConfig)
        const infos = await transporter.sendMail({
                   from: '"Onebaz" ' + senderEmailAccount,
            to: email,
            subject: `Bienvenue sur OneBaz ${firstname},  👋 Nous sommes ravis de te rencontrer 💙 `,
            text: ``,
            html: `<html lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.=
0">
<title>
    Bienvenue sur OneBaz,👋 je suis ravis de te rencontrer 💙
</title>
<style>
.texton{font-size:25px;}
@media screen and (max-width:414px) {
  body {
    min-width: 100%; margin: 0 auto !important; padding: 0 !important;
  }
  .texton{font-size:14px;}
  }
</style>

</head>
<body data-gramm="true" data-gramm_editor="true" data-gramm_id="21711=
bc6-8698-9304-9627-bcce202d2bde" style="margin: 0;" bgcolor="#f0f0f0">


<div class=""><div class="aHl"></div><div id=":16m" tabindex="-1"></div><div id=":18e" class="ii gt" jslog="20277; u014N:xr6bB; 4:W251bGwsbnVsbCxbXV0."><div id=":10w" class="a3s aiL msg9148570384906004922"><u></u>








    <div style="margin:0" bgcolor="#f0f0f0">
    
    <table bgcolor="#f0f0f0" align="center" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tbody>
        <tr>
          <td>
            <table class="m_9148570384906004922fullwidth" align="center" bgcolor="f0f0f0" border="0" cellpadding="0" cellspacing="0" width="640" style="margin:0 auto">
            <tbody>
            <tr>
                <td align="center">
                    <table id="m_9148570384906004922header" border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tbody>
                            <tr>
                                <td>
                                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                    <tbody>
                                        <tr>
                                            
                                            <td align="center" style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Fira Sans','Droid Sans','Helvetica Neue',sans-serif;font-size:0px!important;color:#f0f0f0;overflow:hidden!important;padding:0px"><span style="font-size:0;display:block;height:0px;overflow:hidden">Entraîne-toi avec des personnes de langue maternelle sur <span class="il">Busuu</span> </span></td>
                                            
                                        </tr>
                                    </tbody>
                                </table>
                              
                                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                    <tbody><tr>
                                        <td bgcolor="#ffffff" align="center" width="100%" style="border-top-right-radius:10px;border-top-left-radius:10px;border-bottom-right-radius:10px;border-bottom-left-radius:10px">
                                            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                <tbody><tr>
                                                    
                                                    
                                                    <td class="m_9148570384906004922mobile-background" background="https://ci6.googleusercontent.com/proxy/Sr8-Gwmr4HscMFmIEfex8WiT4RzWqJUG28jQ4EIwxwlk8fyx0LnjxmezUL9fl9UoHrJz9WEX1hhFCzfVG-WAbHHqovy-QQvTYvp2h1SULpnMclV26VPFC4SY3tZCQdSXvB5-GgIK4PSvN9t747xYo0MTQeSO2Pl9XQqa03PFMK_Rp6ArgjzycEp7ZPvu=s0-d-e1-ft#https://appboy-images.com/appboy/communication/assets/image_assets/images/60098a46a2ed0803e7a3ae/original.png?1611237958" width="640" height="160" valign="top" style="border-top-right-radius:10px;border-top-left-radius:10px;background:url('https://ci6.googleusercontent.com/proxy/Sr8-Gwmr4HscMFmIEfex8WiT4RzWqJUG28jQ4EIwxwlk8fyx0LnjxmezUL9fl9UoHrJz9WEX1hhFCzfVG-WAbHHqovy-QQvTYvp2h1SULpnMclV26VPFC4SY3tZCQdSXvB5-GgIK4PSvN9t747xYo0MTQeSO2Pl9XQqa03PFMK_Rp6ArgjzycEp7ZPvu=s0-d-e1-ft#https://appboy-images.com/appboy/communication/assets/image_assets/images/60098a46a2ed0803e7a3ae/original.png?1611237958') no-repeat top center">
                                                        
                                                        <a href="https://onebaz.com" style="color:#fa4f38;text-decoration:none;display:block;width:100%" target="_blank" >
                                                            <div>
                                                                
                                                                <table align="left" border="0" cellpadding="0" cellspacing="0" width="100%">
                                                                     <tbody><tr>
                                                                        
                                                                        <td class="m_9148570384906004922padLogo" align="left" style="padding:30px 0 0 35px;border:none" valign="top" width="640">
                                                                            <a href="https://onebaz.com" style="display:block;text-decoration:none;width:162px" title="OneBaz" target="_blank" data-saferedirecturl="https://www.google.com/url?q=http://link.announce.busuu.com/ls/click?upn%ZKM7Bp4OYLjoCfpbOQ9LGOqzG2uVCIUxR8KJGk5jYn-2FWtuwYI8QwgJnGAyyLQtoICZ09MY9wld-2B5O9qHF4wmdCbpWNsKUmTIu8rng-2BN3FLjZa-2Bjz0mqQBwVQE-2FzFRQy-2FnP-2F2pg0Wt3ZEqC7oghySrQegm1-2FdGr8-2BQHXL2SBY2r-2B6z1WRsQ-2FxF9qST-2BkbnF6KhgJW_1-2FCwlzuWv1dYsr88nLietQKyWdSPFt8zb-2FZ16-2BnzwiAb7dLFfHUN74hnKWtjnyP-2BzWb3677g2DjEjohFG0vpx3T4XOa0RnWmgtittb6QaN-2BTV3lNxwqDiS1AY5erXF4wyu27RAOn2fTsloKfIe-2F2-2B3vLPRajKj5ous10AvgyvnqsLBHNHfiiAtn1tezpEopEbOubzKMX63v1K1RjvWSkAJ4NZmYi582-2F6g8JX3suU3K-2Fl0XUxVur40TOXIprDsdB1n4EgBaLV3hGmSQeyLpcqwugjfovNUvas2EmEBVOJ6jYD06BAzvWJa9eO-2BtUIEexD5TEU8t52wW-2FwBXjld2pggcOFSn6DXHfhjgtHy0xNYJj-2FxhAM9urAtwvdBYyjxLNOsmAZHAUsEIsANjn1Hl7HJoVXy34cqXA5Oe864gh1y-2BxCsXnr3fzLIRR0qSVMLFqmdF-2FbFrnIeI7cyoYSjQymZ4U5FW9058HIt9yd-2BPn-2FgiCySdo0ufhjAWXd4myfrD9s3GRTbOJmqQ09XeDruNXV8k9VgPcoxGATiGlApEfOHLW6UeS-2FfuAmfG8yMXba8BYpvdVZ9H5-2B1ZaORh695-2BCTX2XB7KHGFOxMDwu7xRCFONVoyGtT6McT8Fq4nOiIFOOKqrSAwsN1KPmdgtCShbB-2BX9IX82yUV5g4e59I7Z-2FJ6dBgXV6UaC8dWRuOyaBYX9gqFk-2FX4Ova1fPVpETJHCQ38ydnMRhkGgbhTPFwrZJlv0-&amp;source=gmail&amp;ust=1649518153390000&amp;usg=AOvVaw23bGqxY8V_F4IiYUXlOn-m">

<h1 style="color:#fff;margin-top:0px">OneBaz</h1>
                                                                        </a></td>
                                                                        
                                                                    </tr>
                                                                
                                                                    <tr>
                                                                        
                                                                        <td align="right" class="texton" style="line-height:0%;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Fira Sans','Droid Sans','Helvetica Neue',sans-serif;font-weight:bold;color:#116eee;padding:0px 30px" width="100%">
                                                                            <p style="margin-top:-45px"> Bienvenue sur OneBaz </p>
                                                                        </td>
                                                                        
                                                                    </tr>
                                                                </tbody></table>
                                                            </div>
                                                        </a>
                                                        
                                                    </td>
                                                    
                                                    
                                                </tr>
                                            </tbody></table>
                                            
                                            <table align="left" border="0" cellpadding="0" cellspacing="0" width="100%">
                                                <tbody>
                                                    <tr>
                                                        <td class="m_9148570384906004922fontS15" align="left" style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Fira Sans','Droid Sans','Helvetica Neue',sans-serif;font-size:18px;color:#252b2f;padding:30px 30px 0" width="100%">
                                                            <p style="font-weight:bold;text-transform:capitalize;margin-top:0"> Bonjour, ${firstname} ${lastname} </p>
                                                            
                                                                <p>Utilises ces identifiants pour te connecter à la plateforme</p>
                                                            
                                                            <p style="font-weight:bold;padding-bottom:10px">Login: ${email} </p>
                                                            <p style="font-weight:bold;padding-bottom:10px">Mot de passe: ${password} </p>
                                                     
                                                        </td>




                                                    </tr>
                                                    
                                                    
                                                     <tr>
                                                        <td valign="bottom" align="center" width="100%" style="padding:40px 30px 30px">
                                                            <table class="m_9148570384906004922width200" align="center" border="0" cellpadding="0" cellspacing="0" width="300">
                                                                <tbody>
                                                                    <tr>
                                                                        <td class="m_9148570384906004922fontS17" width="100%" style="border-radius:50px;font-size:20px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Fira Sans','Droid Sans','Helvetica Neue',sans-serif;margin:0 auto;padding:14px 15px" align="center" bgcolor="#116EEE">
                                                                            <a href="https://${subdomain}.onebaz.com"  style="text-align:center;color:#ffffff;text-decoration:none;display:block;width:100%" title="" target="_blank">Démarrer maintenant</a>
                                                                        </td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                    
                                                 
                                                    
                                                </tbody>
                                            </table>
    
                                           
                                            
                                        </td>
                                    </tr>
                                </tbody></table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    
                    
                                    
                    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tbody>
                            
                            <tr>
                               <td align="center" width="100%" style="font-size:1px;padding:0">
                                  &nbsp;
                               </td>
                            </tr>
                            
                        </tbody>
                    </table>
                    <table id="m_9148570384906004922footer" align="center" bgcolor="#f0f0f0" border="0" cellpadding="0" cellspacing="0" width="100%" style="text-align:center">
                        <tbody>
                            <tr>
                                <td align="center" valign="middle" width="100%">
                                    <table align="center" border="0" cellpadding="0" cellspacing="0" width="15%">
                                        <tbody>
                                            <tr>
                                                <td class="m_9148570384906004922footer-icon" align="center" style="width:25px;padding:26px 4px 0" valign="middle"><a href="https://web.facebook.com/Onebaz-101699781390408" style="display:block" title="Facebook" target="_blank" style="display:block;border:0" width="25" height="auto" class="CToWUd"> </a></td>
    
                                                <td class="m_9148570384906004922footer-icon" align="center" style="width:25px;padding:26px 4px 0" valign="middle"><a href="" style="display:block" title="Instagram" target="_blank" 
                                                    >
                                                    
                                                    <img alt="Instagram" src="https://ci6.googleusercontent.com/proxy/TETFFTcz0IZgowyDrUHCdP3p2xZvnGjewIQihElAD3IWWa3QZiTXJdiVAhipQAPmHNaIWGYTPUEt12Zu8XqHmrcmjoXGeIr0T7rQ5DpOu4CHDmxOeGtMWhw7nJNY2hRdaleyQXD5altLNoaqlvpobMvaBNfjWH98aR4cNVExgRkYzJ3fVVz1uWoCW7C1=s0-d-e1-ft#https://appboy-images.com/appboy/communication/assets/image_assets/images/5e148c110464b9080139f7a0/original.png?1578404881" style="display:block;border:0" width="25" height="auto" class="CToWUd"> </a></td>
    
                                                <td class="m_9148570384906004922footer-icon" align="center" style="width:25px;padding:26px 4px 0" valign="middle"><a href="" style="display:block" title="YouTube" target="_blank"><img alt="YouTube" src="https://ci5.googleusercontent.com/proxy/8bzP0dPPlMXuaQngFhFEscc5tnrrc5GzcyDajkjl5H7HTbBkNYXEkvukXaFFW1Xn-duj-DfeKDx2vRIfC4fC02QA0ay5eF1se4-18PgL1HTswhEMhWrD4_vp9G_wb20mUdYdOIbRnUjBnkLA_0O4AxtUliP1Em4kXKUEXjfJIBK_oaKhoCDOhvp3VuLJ=s0-d-e1-ft#https://appboy-images.com/appboy/communication/assets/image_assets/images/5e148c11167e9235b83f8cc7/original.png?1578404881" style="display:block;border:0" width="25" height="auto" class="CToWUd"> </a></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>					
                            <tr>
                                <td align="center" style="line-height:18px;width:100%;padding:0px 24px">
                                    <table class="m_9148570384906004922footer-nav" border="0" cellpadding="0" cellspacing="0" width="100%">
                                        <tbody>
                                            
                                            </tbody></table></td>
    </tr>
    <tr>
                                                <td colspan="2" align="center" valign="top" style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Fira Sans','Droid Sans','Helvetica Neue',sans-serif;font-size:12px;color:#666e7e;padding:20px 45px 0">
                                                    <p style="margin:0"><span class="il">LefaxTalents</span> Limited, Yaoundé Chapelle Nsimeyong </p>
                                                    <p class="m_9148570384906004922marginT12" style="margin:0">© 2022 - Tous droits réservés. Numéro de société&nbsp;: <a style="text-decoration:none;color:#666e7e">PD59212714415G</a></p>
                                                </td>
                                            </tr>
                                            <tr>
                                           
                                            </tr>
                                            
                                          
                                            
                                            <tr>
                                                <td bgcolor="#f0f0f0" height="24" style="height:24px">&nbsp;</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    
    
                    </td>
                </tr>
            </tbody>
            </table>
          
        
      
      
    
    
    
    </div></div><div class="adL">
    
    
    </div></div></div><div id=":16f" class="ii gt" style="display:none"><div id=":10j" class="a3s aiL "></div></div><div class="hi"></div></div>


</body>
</html>`
        })
        if (infos.accepted.includes(email)) {
            console.log('Employee credentials email sent')
            return true
        }
        console.log('Employee credentials email not sent')
        return false
    } 
    catch (error) {
        console.error(error)
    }
}

const tenantCreationEmail = async (subdomain, email,name) => {
    try {
        const transporter = nodeMailer.createTransport(emailConfig)
        const infos = await transporter.sendMail({
            from: '"Onebaz" ' + senderEmailAccount,
            to: email,
            subject: `Bienvenue sur OneBaz, ${name} 👋 Nous sommes ravis de te rencontrer 💙 `,
            text: ``,
            html: `<html lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.=
0">
<title>
    Bienvenue sur OneBaz,👋 je suis ravis de te rencontrer 💙
</title>
<style>
.texton{font-size:25px;}
@media screen and (max-width:414px) {
  body {
    min-width: 100%; margin: 0 auto !important; padding: 0 !important;
  }
  .texton{font-size:14px;}
  }
</style>

</head>
<body data-gramm="true" data-gramm_editor="true" data-gramm_id="21711=
bc6-8698-9304-9627-bcce202d2bde" style="margin: 0;" bgcolor="#f0f0f0">


<div class=""><div class="aHl"></div><div id=":16m" tabindex="-1"></div><div id=":18e" class="ii gt" jslog="20277; u014N:xr6bB; 4:W251bGwsbnVsbCxbXV0."><div id=":10w" class="a3s aiL msg9148570384906004922"><u></u>








    <div style="margin:0" bgcolor="#f0f0f0">
    
    <table bgcolor="#f0f0f0" align="center" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tbody>
        <tr>
          <td>
            <table class="m_9148570384906004922fullwidth" align="center" bgcolor="f0f0f0" border="0" cellpadding="0" cellspacing="0" width="640" style="margin:0 auto">
            <tbody>
            <tr>
                <td align="center">
                    <table id="m_9148570384906004922header" border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tbody>
                            <tr>
                                <td>
                                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                    <tbody>
                                        <tr>
                                            
                                            <td align="center" style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Fira Sans','Droid Sans','Helvetica Neue',sans-serif;font-size:0px!important;color:#f0f0f0;overflow:hidden!important;padding:0px"><span style="font-size:0;display:block;height:0px;overflow:hidden">Entraîne-toi avec des personnes de langue maternelle sur <span class="il">Busuu</span> </span></td>
                                            
                                        </tr>
                                    </tbody>
                                </table>
                              
                                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                    <tbody><tr>
                                        <td bgcolor="#ffffff" align="center" width="100%" style="border-top-right-radius:10px;border-top-left-radius:10px;border-bottom-right-radius:10px;border-bottom-left-radius:10px">
                                            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                <tbody><tr>
                                                    
                                                    
                                                    <td class="m_9148570384906004922mobile-background" background="https://ci6.googleusercontent.com/proxy/Sr8-Gwmr4HscMFmIEfex8WiT4RzWqJUG28jQ4EIwxwlk8fyx0LnjxmezUL9fl9UoHrJz9WEX1hhFCzfVG-WAbHHqovy-QQvTYvp2h1SULpnMclV26VPFC4SY3tZCQdSXvB5-GgIK4PSvN9t747xYo0MTQeSO2Pl9XQqa03PFMK_Rp6ArgjzycEp7ZPvu=s0-d-e1-ft#https://appboy-images.com/appboy/communication/assets/image_assets/images/60098a46a2ed0803e7a3ae/original.png?1611237958" width="640" height="160" valign="top" style="border-top-right-radius:10px;border-top-left-radius:10px;background:url('https://ci6.googleusercontent.com/proxy/Sr8-Gwmr4HscMFmIEfex8WiT4RzWqJUG28jQ4EIwxwlk8fyx0LnjxmezUL9fl9UoHrJz9WEX1hhFCzfVG-WAbHHqovy-QQvTYvp2h1SULpnMclV26VPFC4SY3tZCQdSXvB5-GgIK4PSvN9t747xYo0MTQeSO2Pl9XQqa03PFMK_Rp6ArgjzycEp7ZPvu=s0-d-e1-ft#https://appboy-images.com/appboy/communication/assets/image_assets/images/60098a46a2ed0803e7a3ae/original.png?1611237958') no-repeat top center">
                                                        
                                                        <a href="https://onebaz.com" style="color:#fa4f38;text-decoration:none;display:block;width:100%" target="_blank" >
                                                            <div>
                                                                
                                                                <table align="left" border="0" cellpadding="0" cellspacing="0" width="100%">
                                                                     <tbody><tr>
                                                                        
                                                                        <td class="m_9148570384906004922padLogo" align="left" style="padding:30px 0 0 35px;border:none" valign="top" width="640">
                                                                            <a href="https://onebaz.com" style="display:block;text-decoration:none;width:162px" title="OneBaz" target="_blank" data-saferedirecturl="https://www.google.com/url?q=http://link.announce.busuu.com/ls/click?upn%ZKM7Bp4OYLjoCfpbOQ9LGOqzG2uVCIUxR8KJGk5jYn-2FWtuwYI8QwgJnGAyyLQtoICZ09MY9wld-2B5O9qHF4wmdCbpWNsKUmTIu8rng-2BN3FLjZa-2Bjz0mqQBwVQE-2FzFRQy-2FnP-2F2pg0Wt3ZEqC7oghySrQegm1-2FdGr8-2BQHXL2SBY2r-2B6z1WRsQ-2FxF9qST-2BkbnF6KhgJW_1-2FCwlzuWv1dYsr88nLietQKyWdSPFt8zb-2FZ16-2BnzwiAb7dLFfHUN74hnKWtjnyP-2BzWb3677g2DjEjohFG0vpx3T4XOa0RnWmgtittb6QaN-2BTV3lNxwqDiS1AY5erXF4wyu27RAOn2fTsloKfIe-2F2-2B3vLPRajKj5ous10AvgyvnqsLBHNHfiiAtn1tezpEopEbOubzKMX63v1K1RjvWSkAJ4NZmYi582-2F6g8JX3suU3K-2Fl0XUxVur40TOXIprDsdB1n4EgBaLV3hGmSQeyLpcqwugjfovNUvas2EmEBVOJ6jYD06BAzvWJa9eO-2BtUIEexD5TEU8t52wW-2FwBXjld2pggcOFSn6DXHfhjgtHy0xNYJj-2FxhAM9urAtwvdBYyjxLNOsmAZHAUsEIsANjn1Hl7HJoVXy34cqXA5Oe864gh1y-2BxCsXnr3fzLIRR0qSVMLFqmdF-2FbFrnIeI7cyoYSjQymZ4U5FW9058HIt9yd-2BPn-2FgiCySdo0ufhjAWXd4myfrD9s3GRTbOJmqQ09XeDruNXV8k9VgPcoxGATiGlApEfOHLW6UeS-2FfuAmfG8yMXba8BYpvdVZ9H5-2B1ZaORh695-2BCTX2XB7KHGFOxMDwu7xRCFONVoyGtT6McT8Fq4nOiIFOOKqrSAwsN1KPmdgtCShbB-2BX9IX82yUV5g4e59I7Z-2FJ6dBgXV6UaC8dWRuOyaBYX9gqFk-2FX4Ova1fPVpETJHCQ38ydnMRhkGgbhTPFwrZJlv0-&amp;source=gmail&amp;ust=1649518153390000&amp;usg=AOvVaw23bGqxY8V_F4IiYUXlOn-m">

<h1 style="color:#fff;margin-top:0px">OneBaz</h1>
                                                                        </a></td>
                                                                        
                                                                    </tr>
                                                                
                                                                    <tr>
                                                                        
                                                                        <td align="right" class="texton" style="line-height:0%;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Fira Sans','Droid Sans','Helvetica Neue',sans-serif;font-weight:bold;color:#116eee;padding:0px 30px" width="100%">
                                                                            <p style="margin-top:-45px"> Bienvenue sur OneBaz </p>
                                                                        </td>
                                                                        
                                                                    </tr>
                                                                </tbody></table>
                                                            </div>
                                                        </a>
                                                        
                                                    </td>
                                                    
                                                    
                                                </tr>
                                            </tbody></table>
                                            
                                            <table align="left" border="0" cellpadding="0" cellspacing="0" width="100%">
                                                <tbody>
                                                    <tr>
                                                        <td class="m_9148570384906004922fontS15" align="left" style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Fira Sans','Droid Sans','Helvetica Neue',sans-serif;font-size:18px;color:#252b2f;padding:30px 30px 0" width="100%">
                                                            <p style="font-weight:bold;text-transform:capitalize;margin-top:0"> Bonjour  ${name} ,</p>
                                                            
                                                                <p>Tu nous as choisi pour t'accompagner dans la gestion de ton business, bonne idée !</p>
                                                            
                                                            <p style="font-weight:bold;padding-bottom:10px">Comment debuter ?</p>
                                                            <p><b>1.</b>&nbsp;&nbsp;Enregistres tes produits/services</p>
                                                            <p><b>2.</b>&nbsp;&nbsp;Definis clairement les roles de tes employés</p>
                                                            <p><b>3.</b>&nbsp;&nbsp;Configure correctement les informations de ton business</p>
                                                     
                                                            <p>N'hésites pas à nous contacter directement si tu as la moindre question.</p>

                                                     
                                                        </td>




                                                    </tr>
                                                    
                                                    <tr>
                                                        <td valign="bottom" align="center" width="100%" style="padding:40px 30px 30px">
                                                            <table class="m_9148570384906004922width200" align="center" border="0" cellpadding="0" cellspacing="0" width="300">
                                                                <tbody>
                                                                    <tr>
                                                                        <td class="m_9148570384906004922fontS17" width="100%" style="border-radius:50px;font-size:20px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Fira Sans','Droid Sans','Helvetica Neue',sans-serif;margin:0 auto;padding:14px 15px" align="center" bgcolor="#116EEE">
                                                                            <a href="https://${subdomain}.onebaz.com"  style="text-align:center;color:#ffffff;text-decoration:none;display:block;width:100%" title="" target="_blank">Démarrer maintenant</a>
                                                                        </td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                    
                                                </tbody>
                                            </table>
    
                                           
                                            
                                        </td>
                                    </tr>
                                </tbody></table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    
                    
                                    
                    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tbody>
                            
                            <tr>
                               <td align="center" width="100%" style="font-size:1px;padding:0">
                                  &nbsp;
                               </td>
                            </tr>
                            
                        </tbody>
                    </table>
                    <table id="m_9148570384906004922footer" align="center" bgcolor="#f0f0f0" border="0" cellpadding="0" cellspacing="0" width="100%" style="text-align:center">
                        <tbody>
                            <tr>
                                <td align="center" valign="middle" width="100%">
                                    <table align="center" border="0" cellpadding="0" cellspacing="0" width="15%">
                                        <tbody>
                                            <tr>
                                                <td class="m_9148570384906004922footer-icon" align="center" style="width:25px;padding:26px 4px 0" valign="middle"><a href="https://web.facebook.com/Onebaz-101699781390408" style="display:block" title="Facebook" target="_blank" style="display:block;border:0" width="25" height="auto" class="CToWUd"> </a></td>
    
                                                <td class="m_9148570384906004922footer-icon" align="center" style="width:25px;padding:26px 4px 0" valign="middle"><a href="" style="display:block" title="Instagram" target="_blank" 
                                                    >
                                                    
                                                    <img alt="Instagram" src="https://ci6.googleusercontent.com/proxy/TETFFTcz0IZgowyDrUHCdP3p2xZvnGjewIQihElAD3IWWa3QZiTXJdiVAhipQAPmHNaIWGYTPUEt12Zu8XqHmrcmjoXGeIr0T7rQ5DpOu4CHDmxOeGtMWhw7nJNY2hRdaleyQXD5altLNoaqlvpobMvaBNfjWH98aR4cNVExgRkYzJ3fVVz1uWoCW7C1=s0-d-e1-ft#https://appboy-images.com/appboy/communication/assets/image_assets/images/5e148c110464b9080139f7a0/original.png?1578404881" style="display:block;border:0" width="25" height="auto" class="CToWUd"> </a></td>
    
                                                <td class="m_9148570384906004922footer-icon" align="center" style="width:25px;padding:26px 4px 0" valign="middle"><a href="" style="display:block" title="YouTube" target="_blank"><img alt="YouTube" src="https://ci5.googleusercontent.com/proxy/8bzP0dPPlMXuaQngFhFEscc5tnrrc5GzcyDajkjl5H7HTbBkNYXEkvukXaFFW1Xn-duj-DfeKDx2vRIfC4fC02QA0ay5eF1se4-18PgL1HTswhEMhWrD4_vp9G_wb20mUdYdOIbRnUjBnkLA_0O4AxtUliP1Em4kXKUEXjfJIBK_oaKhoCDOhvp3VuLJ=s0-d-e1-ft#https://appboy-images.com/appboy/communication/assets/image_assets/images/5e148c11167e9235b83f8cc7/original.png?1578404881" style="display:block;border:0" width="25" height="auto" class="CToWUd"> </a></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>					
                            <tr>
                                <td align="center" style="line-height:18px;width:100%;padding:0px 24px">
                                    <table class="m_9148570384906004922footer-nav" border="0" cellpadding="0" cellspacing="0" width="100%">
                                        <tbody>
                                            
                                            </tbody></table></td>
    </tr>
    <tr>
                                                <td colspan="2" align="center" valign="top" style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Fira Sans','Droid Sans','Helvetica Neue',sans-serif;font-size:12px;color:#666e7e;padding:20px 45px 0">
                                                    <p style="margin:0"><span class="il">LefaxTalents</span> Limited, Yaoundé Chapelle Nsimeyong </p>
                                                    <p class="m_9148570384906004922marginT12" style="margin:0">© 2022 - Tous droits réservés. Numéro de société&nbsp;: <a style="text-decoration:none;color:#666e7e">PD59212714415G</a></p>
                                                </td>
                                            </tr>
                                            <tr>
                                           
                                            </tr>
                                            
                                          
                                            
                                            <tr>
                                                <td bgcolor="#f0f0f0" height="24" style="height:24px">&nbsp;</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    
    
                    </td>
                </tr>
            </tbody>
            </table>
          
        
      
      
    
    
    
    </div></div><div class="adL">
    
    
    </div></div></div><div id=":16f" class="ii gt" style="display:none"><div id=":10j" class="a3s aiL "></div></div><div class="hi"></div></div>


</body>
</html>`
        })
        if (infos.accepted.includes(email)) {
            console.log('Tenant-creation confirmation email sent')
            return true
        }
        console.log('Tenant-creation confirmation email not sent')
        return false
    } 
    catch (error) {
        console.error(error)
    }
}

const emailSentToVendorAfterPurchaseCreation = async (email, informations) => {
    try {
        const transporter = nodeMailer.createTransport(emailConfig)
        const infos = await transporter.sendMail({
            from: '"Onebaz" ' + senderEmailAccount,
            to: email,
            subject: 'Purchase Creation Notification',
            text: `Information about purchase: ${informations}.`,
            html: `<html>
                    <body>
                        <p>Information about purchase: ${informations}.</p>
                    </body>
                   </html>`
        })
        if (infos.accepted.includes(email)) {
            console.log('Vendor notification email sent')
            return true
        }
        console.log('Vendor notification email not sent')
        return false
    } 
    catch (error) {
        console.error(error)    
    }
}

const emailSentToVendorAfterPurchaseUpdating = async (email, informations) => {
    try {
        const transporter = nodeMailer.createTransport(emailConfig)
        const infos = await transporter.sendMail({
            from: '"Onebaz" ' + senderEmailAccount,
            to: email,
            subject: 'Purchase Updating Notification',
            text: `Information about purchase: ${informations}.`,
            html: `<html>
                    <body>
                        <p>Information about purchase: ${informations}.</p>
                    </body>
                   </html>`
        })
        if (infos.accepted.includes(email)) {
            console.log('Vendor notification email sent')
            return true
        }
        console.log('Vendor notification email not sent')
        return false
    } 
    catch (error) {
        console.error(error)    
    }
}

module.exports = { adminEmailVerification, adminAuthenticationEmail, resetAdminPasswordEmail, tenantEmailVerification, tenantUserEmailVerification, tenantUserAuthenticationEmail, resetTenantUserPasswordEmail, tenantCreationEmail, employeeCredentialsEmail, emailSentToVendorAfterPurchaseCreation, emailSentToVendorAfterPurchaseUpdating }
