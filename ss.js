import wixData from 'wix-data';
import { sendEmailToClient } from 'backend/sendEmail';
import { sendEmailToAdmin } from 'backend/sendEmail';
import wixLocation from 'wix-location';



//====================== load the order for the current user ===============
let order;
let orderNumber;
let orderDate;

var userId;
let customerFullName;
let address;
let cityCountry;
let phone;
let mobile;
let email;
let contact;

let deliveryFullName;
let deliveryAddress;
let deliveryCityCountry;
let deliveryMethod;
let deliveryCharges;
let request;

let paymentStatus;
let paymentMethod;

let productDataArray;
let userCart;
let image;
var productList = '';
var productName = '';
var sku ='';
var description ='';
var size ='';
var color ='';
var sizeColor ='';
var quantity = '';
var amount = '';

let subtotal;
let discount;
let couponId;
let vat;
let total;

let url;
let details;

let isEmailSent = false;



$w.onReady(async function () {

    details = $w("#orderDataset").getCurrentItem();
    let Item = details;

    order = Item.orderNumber;
    orderNumber = Item.orderNumber;
    orderDate = Item._createdDate;
    customerFullName = Item.customerFullName;
    address = Item.address;
    cityCountry = Item.cityCountry;
    phone = Item.phone;
    mobile = Item.mobile;
    contact = Item.contact;
    email = Item.email;
    deliveryFullName = Item.deliveryFullName;
    deliveryAddress = Item.deliveryAddress;
    deliveryCityCountry = Item.deliveryCityCountry;
    deliveryMethod = Item.deliveryMethod;

    if (Item.request === undefined) {
            request = 'None';
        } else  {
            request = Item.request;
        }

    if (Item.deliveryCharges === 0) {
        deliveryCharges = 'AED 0.00';
    } else if (Item.deliveryCharges > 0) {
        deliveryCharges = 'AED ' + Number(Item.deliveryCharges).toFixed(2);
    }


    paymentStatus = 'Cash On Delivery - Payment Upon Delivery';
    paymentMethod = 'Cash On Delivery';
    subtotal = 'AED ' + (Item.subtotal).toFixed(2);
    discount = 'AED ' + (Item.discount).toFixed(2);

    if (Item.couponId === undefined) {
        couponId = '';
    } else {
        couponId = '(Code: ' + Item.couponId + ')';
    }
    
    total = 'AED ' + (Item.total).toFixed(2);

    if (vat === 0 || vat === undefined) {
      vat = 'AED 0.00';
    } else {
      vat = 'AED ' + (Item.vat).toFixed(2);
    }
    
    url = 'https://www.unboxbasics.com/order-confirmation/' + Item.orderNumber;
    userCart = Item.userCart;

    userCart.forEach((item) => {
        
        productList += (
            '<b>' + item.productName + '</b>' + '<br>' +
            'SKU: ' + item.productId + '<br>' +
            item.size + ', ' + item.color + '<br>' +
            'Qty. x' + item.quantity + '<br>' +
            'AED ' + (item.amount).toFixed(2) + '<br>' +
            item.intro + '<br>' + '<br>');
    });

    //----------------------------------------------------------------------- Clean Cart after payment successful Order/Payment -------------------------------------- //

    userCart.forEach((item) => {
        wixData.remove('ShopCart', item._id)
    });

    $w('#orderNumber').text = 'Order #' + orderNumber;
    $w('#orderDate').text = 'Order Date: ' + orderDate;
    $w('#phoneMobile').text = contact;
    $w('#subtotal').text = subtotal;
    $w('#vat').text = vat;
    $w('#deliveryCharges').text = deliveryCharges;
    $w('#discount').text = discount;
    $w('#discountCoupon').text = couponId;
    $w('#total').text = total;

    $w("#cartRepeater").data = await details.userCart;
    $w("#cartRepeater").data = details.productDataArray;
    $w('#cartRepeater').onItemReady(($item, itemData, index) => {
        if (itemData.size !== undefined) {
            $item('#size').expand();
            $item('#size').text = itemData.size;
        }
        if (itemData.color !== undefined) {
            $item('#color').expand();
            $item('#color').text = itemData.color;
        }
        $item("#productName").text = itemData.productName;
        $item("#sku").text = 'SKU: ' + itemData.productId;
        $item("#image").src = itemData.image;
        $item("#amount").text = 'AED ' + (itemData.amount).toFixed(2);
        $item('#quantity').text = String(itemData.quantity);
    });

    $w("#orderDataset").onReady(() => {
        $w("#orderDataset").getItems(0, 1)
            .then((result) => {
                let items = result.items;
                let item = result.items[0];
                console.log(item.emailSent);
                if (item.emailSent !== true && item.paymentStatus == "Payment Upon Delivery" && !isEmailSent) {
                  isEmailSent = true;
                    wixData.update("ShopOrders", item);
                    console.log('Email sent')
                    sendFormEmailToClient();
                    sendFormEmailToAdmin();
                    updateQuantityMinus();
                } else if(!isEmailSent) {
                  sendFormEmailToClient('write2ranarahul@gmail.com');
                    console.log('Email Not sent')
                }
            })
            .catch((err) => {
                let errMsg = err.message;
                let errCode = err.code;
            });
    });

});


//-------------------------------------------------------------------- Update stock and bought ------------------------------------------------ //

export async function updateQuantityMinus() {
    userCart.forEach((item) => {
        wixData.get("Inventory", item.itemId)
            .then((Item) => {
                Item.stock = Item.stock - item.quantity;
                wixData.update("Inventory", Item);
            })
            .catch((err) => {
                let errorMsg = err;
            });
    });

    userCart.forEach((item) => {
        wixData.get("ShopProducts", item.mainItemId)
            .then((Item) => {
                Item.bought = ++Item.bought;
                wixData.update("ShopProducts", Item);
            })
            .catch((err) => {
                let errorMsg = err;
            });
    });

}


//----------------------------------------------------------------- Send Email ---------------------------------------------------------- //

function sendFormEmailToClient(userEmail) {

    const subject = 'Order #' + orderNumber + ' - Thanks for shopping with us!'

    const body = `


<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html data-editor-version="2" class="sg-campaigns" xmlns="http://www.w3.org/1999/xhtml">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1">
      
      <meta http-equiv="X-UA-Compatible" content="IE=Edge">
      
      <!--[if (gte mso 9)|(IE)]>
      <xml>
        <o:OfficeDocumentSettings>
          <o:AllowPNG/>
          <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
      </xml>
      <![endif]-->
      <!--[if (gte mso 9)|(IE)]>
  <style type="text/css">
    body {width: 600px;margin: 0 auto;}
    table {border-collapse: collapse;}
    table, td {mso-table-lspace: 0pt;mso-table-rspace: 0pt;}
    img {-ms-interpolation-mode: bicubic;}
  </style>
<![endif]-->
      <style type="text/css">
    body, p, div {
      font-family: arial,helvetica,sans-serif;
      font-size: 14px;
    }
    body {
      color: #000000;
    }
    body a {
      color: #0632FF;
      text-decoration: none;
    }
    p { margin: 0; padding: 0; }
    table.wrapper {
      width:100% !important;
      table-layout: fixed;
      -webkit-font-smoothing: antialiased;
      -webkit-text-size-adjust: 100%;
      -moz-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    img.max-width {
      max-width: 100% !important;
    }
    .column.of-2 {
      width: 50%;
    }
    .column.of-3 {
      width: 33.333%;
    }
    .column.of-4 {
      width: 25%;
    }
    ul ul ul ul  {
      list-style-type: disc !important;
    }
    ol ol {
      list-style-type: lower-roman !important;
    }
    ol ol ol {
      list-style-type: lower-latin !important;
    }
    ol ol ol ol {
      list-style-type: decimal !important;
    }
    @media screen and (max-width:480px) {
      .preheader .rightColumnContent,
      .footer .rightColumnContent {
        text-align: left !important;
      }
      .preheader .rightColumnContent div,
      .preheader .rightColumnContent span,
      .footer .rightColumnContent div,
      .footer .rightColumnContent span {
        text-align: left !important;
      }
      .preheader .rightColumnContent,
      .preheader .leftColumnContent {
        font-size: 80% !important;
        padding: 5px 0;
      }
      table.wrapper-mobile {
        width: 100% !important;
        table-layout: fixed;
      }
      img.max-width {
        height: auto !important;
        max-width: 100% !important;
      }
      a.bulletproof-button {
        display: block !important;
        width: auto !important;
        font-size: 80%;
        padding-left: 0 !important;
        padding-right: 0 !important;
      }
      .columns {
        width: 100% !important;
      }
      .column {
        display: block !important;
        width: 100% !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
        margin-left: 0 !important;
        margin-right: 0 !important;
      }
      .social-icon-column {
        display: inline-block !important;
      }
    }
  </style>
      <!--user entered Head Start--><!--End Head user entered-->
    </head>
    <body>
      <center class="wrapper" data-link-color="#0632FF" data-body-style="font-size:14px; font-family:arial,helvetica,sans-serif; color:#000000; background-color:#f5f5f5;">
        <div class="webkit">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" class="wrapper" bgcolor="#f5f5f5">
            <tr>
              <td valign="top" bgcolor="#f5f5f5" width="100%">
                <table width="100%" role="content-container" class="outer" align="center" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td width="100%">
                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td>
                            <!--[if mso]>
    <center>
    <table><tr><td width="600">
  <![endif]-->
                                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px;" align="center">
                                      <tr>
                                        <td role="modules-container" style="padding:0px 0px 0px 0px; color:#000000; text-align:left;" bgcolor="#FFFFFF" width="100%" align="left"><table class="module preheader preheader-hide" role="module" data-type="preheader" border="0" cellpadding="0" cellspacing="0" width="100%" style="display: none !important; mso-hide: all; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0;">
    <tr>
      <td role="module-content">
        <p></p>
      </td>
    </tr>
  </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="7e3f0f68-01d5-464d-a428-b491f380ea95" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:18px 0px 0px 0px; line-height:22px; text-align:inherit; background-color:#F5F5F5;" height="100%" valign="top" bgcolor="#F5F5F5" role="module-content"><div><div style="font-family: inherit; text-align: inherit"><br></div><div></div></div></td>
      </tr>
    </tbody>
  </table><table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" role="module" data-type="columns" style="padding:20px 20px 0px 20px;" bgcolor="#FFFFFF" data-distribution="1,1">
    <tbody>
      <tr role="module-content">
        <td height="100%" valign="top"><table width="270" style="width:270px; border-spacing:0; border-collapse:collapse; margin:0px 10px 0px 0px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-0">
      <tbody>
        <tr>
          <td style="padding:0px;margin:0px;border-spacing:0;"><table class="wrapper" role="module" data-type="image" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="ucgaSfbHNkf8izLL5yjyJe">
    <tbody>
      <tr>
        <td style="font-size:6px; line-height:10px; padding:0px 0px 0px 0px;" valign="top" align="left">
          
        <a clicktracking="off" href="https://www.unboxbasics.com/"><img class="max-width" border="0" style="display:block; color:#000000; text-decoration:none; font-family:Helvetica, arial, sans-serif; font-size:16px; max-width:100% !important; width:100%; height:auto !important;" width="270" alt="UNBOX Basics" data-proportionally-constrained="true" data-responsive="true" src="http://cdn.mcauto-images-production.sendgrid.net/7a4a3c716febe34f/081f6bcd-2956-418f-a4bd-c4e531b9cb9e/681x246.png"></a></td>
      </tr>
    </tbody>
  </table></td>
        </tr>
      </tbody>
    </table><table width="270" style="width:270px; border-spacing:0; border-collapse:collapse; margin:0px 0px 0px 10px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-1">
      <tbody>
        <tr>
          <td style="padding:0px;margin:0px;border-spacing:0;"><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="2NF1DMF9xHdSdPBr8a6Aan" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:18px 0px 18px 0px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: right"><b>Order #${orderNumber}</b></div>
<div style="font-family: inherit; text-align: right">${orderDate}</div>
<div style="font-family: inherit; text-align: right"><span style="color: #00bb04"><b>${paymentStatus}</b></span></div><div></div></div></td>
      </tr>
    </tbody>
  </table></td>
        </tr>
      </tbody>
    </table></td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="divider" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="86d635cd-7077-43cd-b0b3-a7c59b211c27.1.1">
    <tbody>
      <tr>
        <td style="padding:12px 20px 6px 20px;" role="module-content" height="100%" valign="top" bgcolor="">
          <table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" height="1px" style="line-height:1px; font-size:1px;">
            <tbody>
              <tr>
                <td style="padding:0px 0px 1px 0px;" bgcolor="#000000"></td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="ca4379fd-a8e1-4016-bb5e-15ebfbb4bda0.2.3.1" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:20px 20px 0px 20px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: inherit"><span style="font-size: 24px">Thanks for shopping with us!</span></div><div></div></div></td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="ca4379fd-a8e1-4016-bb5e-15ebfbb4bda0.2.3.1.1.1" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:10px 20px 0px 20px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: inherit"><span style="font-size: 14px">Below are your order confirmation and details. Feel free to </span><a clicktracking="off" href="mailto:info@unboxbasics.com?subject=&amp;body="><span style="font-size: 14px; color: #000000"><u>contact us</u></span></a><span style="font-size: 14px"> if you have any questions, suggestions or comments. We hope to see you again.</span></div><div></div></div></td>
      </tr>
    </tbody>
  </table><table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" role="module" data-type="columns" style="padding:20px 0px 30px 0px;" bgcolor="#FFFFFF" data-distribution="1,1">
    <tbody>
      <tr role="module-content">
        <td height="100%" valign="top"><table width="300" style="width:300px; border-spacing:0; border-collapse:collapse; margin:0px 0px 0px 0px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-0">
      <tbody>
        <tr>
          <td style="padding:0px;margin:0px;border-spacing:0;"><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="ca4379fd-a8e1-4016-bb5e-15ebfbb4bda0.1.3.2.3.1" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:10px 20px 0px 20px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: inherit"><span style="font-size: 14px; font-family: arial, helvetica, sans-serif"><b>Billing Information</b></span></div>
<div style="font-family: inherit; text-align: inherit"><span style="font-size: 14px; font-family: arial, helvetica, sans-serif">${customerFullName}</span></div>
<div style="font-family: inherit; text-align: inherit"><span style="font-size: 14px; font-family: arial, helvetica, sans-serif">${address}</span></div>
<div style="font-family: inherit; text-align: inherit"><span style="font-size: 14px; font-family: arial, helvetica, sans-serif">${cityCountry}</span></div>
<div style="font-family: inherit; text-align: inherit"><span style="font-size: 14px; font-family: arial, helvetica, sans-serif">${phone}, ${mobile}</span></div>
<div style="font-family: inherit; text-align: inherit"><span style="font-size: 14px; font-family: arial, helvetica, sans-serif">${email}</span></div><div></div></div></td>
      </tr>
    </tbody>
  </table></td>
        </tr>
      </tbody>
    </table><table width="300" style="width:300px; border-spacing:0; border-collapse:collapse; margin:0px 0px 0px 0px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-1">
      <tbody>
        <tr>
          <td style="padding:0px;margin:0px;border-spacing:0;"><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="ca4379fd-a8e1-4016-bb5e-15ebfbb4bda0.1.3.2.3.1.1" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:10px 20px 0px 20px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: inherit"><span style="font-size: 14px; font-family: arial, helvetica, sans-serif"><b>Delivery information</b></span></div>
<div style="font-family: inherit; text-align: inherit"><span style="font-size: 14px; font-family: arial, helvetica, sans-serif">${deliveryFullName}</span></div>
<div style="font-family: inherit; text-align: inherit"><span style="font-size: 14px; font-family: arial, helvetica, sans-serif">${address}</span></div>
<div style="font-family: inherit; text-align: inherit"><span style="font-size: 14px; font-family: arial, helvetica, sans-serif">${deliveryCityCountry}</span></div>
<div style="font-family: inherit; text-align: inherit"><span style="font-size: 14px; font-family: arial, helvetica, sans-serif">Delivery Schedule: ${deliveryMethod}}</span></div><div></div></div></td>
      </tr>
    </tbody>
  </table></td>
        </tr>
      </tbody>
    </table></td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="divider" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="86d635cd-7077-43cd-b0b3-a7c59b211c27.1.1.2">
    <tbody>
      <tr>
        <td style="padding:0px 20px 0px 20px;" role="module-content" height="100%" valign="top" bgcolor="">
          <table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" height="1px" style="line-height:1px; font-size:1px;">
            <tbody>
              <tr>
                <td style="padding:0px 0px 1px 0px;" bgcolor="#000000"></td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="ca4379fd-a8e1-4016-bb5e-15ebfbb4bda0.2.3.1.1" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:20px 20px 0px 20px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: inherit"><span style="font-size: 14px"><b>Items</b></span></div><div></div></div></td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="ca4379fd-a8e1-4016-bb5e-15ebfbb4bda0.3.1.1.1" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:10px 22px 26px 22px; line-height:22px; text-align:inherit; background-color:#ffffff;" height="100%" valign="top" bgcolor="#ffffff" role="module-content"><div><div style="font-family: inherit; text-align: inherit">${productList}</div><div></div></div></td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="divider" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="86d635cd-7077-43cd-b0b3-a7c59b211c27.1.1.1.1">
    <tbody>
      <tr>
        <td style="padding:0px 20px 0px 20px;" role="module-content" height="100%" valign="top" bgcolor="">
          <table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" height="1px" style="line-height:1px; font-size:1px;">
            <tbody>
              <tr>
                <td style="padding:0px 0px 1px 0px;" bgcolor="#000000"></td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table><table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" role="module" data-type="columns" style="padding:0px 0px 0px 0px;" bgcolor="#FFFFFF" data-distribution="2,1">
    <tbody>
      <tr role="module-content">
        <td height="100%" valign="top"><table width="400" style="width:400px; border-spacing:0; border-collapse:collapse; margin:0px 0px 0px 0px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-0">
      <tbody>
        <tr>
          <td style="padding:0px;margin:0px;border-spacing:0;"><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="ca4379fd-a8e1-4016-bb5e-15ebfbb4bda0.1.3.2.1.3.3" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:20px 20px 0px 20px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: right">Subtotal</div><div></div></div></td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="ca4379fd-a8e1-4016-bb5e-15ebfbb4bda0.1.3.2.1.2.1.3.1" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:0px 20px 0px 20px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: right">Discount ${couponId}</div><div></div></div></td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="ca4379fd-a8e1-4016-bb5e-15ebfbb4bda0.1.3.2.1.2.1.3.1.1" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:0px 20px 0px 20px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: right">Delivery Charge</div><div></div></div></td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="ca4379fd-a8e1-4016-bb5e-15ebfbb4bda0.1.3.2.1.2.1.2.1" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:0px 20px 0px 20px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: right">5% VAT</div><div></div></div></td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="ca4379fd-a8e1-4016-bb5e-15ebfbb4bda0.1.3.2.1.2.1.1.1.1" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:0px 20px 10px 20px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: right"><b>Total</b></div><div></div></div></td>
      </tr>
    </tbody>
  </table></td>
        </tr>
      </tbody>
    </table><table width="200" style="width:200px; border-spacing:0; border-collapse:collapse; margin:0px 0px 0px 0px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-1">
      <tbody>
        <tr>
          <td style="padding:0px;margin:0px;border-spacing:0;"><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="ca4379fd-a8e1-4016-bb5e-15ebfbb4bda0.1.3.2.1.1.2" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:20px 20px 0px 20px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: right">${subtotal}</div><div></div></div></td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="ca4379fd-a8e1-4016-bb5e-15ebfbb4bda0.1.3.2.1.1.1.1.2" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:0px 20px 0px 20px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: right">- ${discount}</div><div></div></div></td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="ca4379fd-a8e1-4016-bb5e-15ebfbb4bda0.1.3.2.1.1.2.1" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:0px 20px 0px 20px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: right">${deliveryCharges}</div><div></div></div></td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="ca4379fd-a8e1-4016-bb5e-15ebfbb4bda0.1.3.2.1.1.2.1.1" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:0px 20px 0px 20px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: right">${vat}</div><div></div></div></td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="ca4379fd-a8e1-4016-bb5e-15ebfbb4bda0.1.3.2.1.1.1.1.1" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:0px 20px 10px 20px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: right"><b>${total}</b></div><div></div></div></td>
      </tr>
    </tbody>
  </table></td>
        </tr>
      </tbody>
    </table></td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="divider" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="86d635cd-7077-43cd-b0b3-a7c59b211c27.1.1.1">
    <tbody>
      <tr>
        <td style="padding:0px 20px 0px 20px;" role="module-content" height="100%" valign="top" bgcolor="">
          <table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" height="1px" style="line-height:1px; font-size:1px;">
            <tbody>
              <tr>
                <td style="padding:0px 0px 1px 0px;" bgcolor="#000000"></td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="ca4379fd-a8e1-4016-bb5e-15ebfbb4bda0.2.3" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:30px 20px 20px 20px; line-height:22px; text-align:inherit; background-color:#ffffff;" height="100%" valign="top" bgcolor="#ffffff" role="module-content"><div><div style="font-family: inherit; text-align: inherit"><span style="font-size: 14px"><em><b>Notes</b></em></span></div>
<div style="font-family: inherit; text-align: inherit"><span style="font-size: 14px"><em>${request}</em></span></div><div></div></div></td>
      </tr>
    </tbody>
  </table><table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" role="module" data-type="columns" style="padding:0px 20px 0px 20px;" bgcolor="#FFFFFF" data-distribution="1,1">
    <tbody>
      <tr role="module-content">
        <td height="100%" valign="top"><table width="270" style="width:270px; border-spacing:0; border-collapse:collapse; margin:0px 10px 0px 0px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-0">
      <tbody>
        <tr>
          <td style="padding:0px;margin:0px;border-spacing:0;"><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="7a92ff1f-9e17-4b8a-a790-2444180a1ea3" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:18px 0px 18px 0px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: inherit"><span style="color: #000000">Contact: </span><a clicktracking="off" href="mailto:info@unboxbasics.com?subject=&amp;body="><span style="color: #000000">info@unboxbasics.com</span></a></div><div></div></div></td>
      </tr>
    </tbody>
  </table></td>
        </tr>
      </tbody>
    </table><table width="270" style="width:270px; border-spacing:0; border-collapse:collapse; margin:0px 0px 0px 10px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-1">
      <tbody>
        <tr>
          <td style="padding:0px;margin:0px;border-spacing:0;"><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="7a92ff1f-9e17-4b8a-a790-2444180a1ea3.1" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:18px 0px 18px 0px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: right"><a clicktracking="off" href="https://www.unboxbasics.com/"><span style="color: #000000; font-size: 18px">www.unboxbasics.com</span></a></div><div></div></div></td>
      </tr>
    </tbody>
  </table></td>
        </tr>
      </tbody>
    </table></td>
      </tr>
    </tbody>
  </table><div data-role="module-unsubscribe" class="module" role="module" data-type="unsubscribe" style="background-color:#f5f5f5; color:#a6a6a6; font-size:12px; line-height:20px; padding:16px 16px 16px 16px; text-align:Center;" data-muid="4e838cf3-9892-4a6d-94d6-170e474d21e5"><div class="Unsubscribe--addressLine"></div><p style="font-size:12px; line-height:20px;"><a target="_blank" class="Unsubscribe--unsubscribeLink zzzzzzz" clicktracking="off" href="{{{unsubscribe}}}" style="color:#a6a6a6;">Unsubscribe</a> - <a clicktracking="off" href="{{{unsubscribe_preferences}}}" target="_blank" class="Unsubscribe--unsubscribePreferences" style="color:#a6a6a6;">Unsubscribe Preferences</a></p></div></td>
                                      </tr>
                                    </table>
                                    <!--[if mso]>
                                  </td>
                                </tr>
                              </table>
                            </center>
                            <![endif]-->
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
      </center>
    </body>
  </html>

`;
console.log(body);
if(userEmail) {
  return sendEmailToClient(userEmail, subject, body)
        .then(() => {
            let dataObj = {
                status: "success"
            };
        })
        .catch((error) => {
            let dataObj = {
                status: "fail"
            };
        })
}

    sendEmailToClient(email, subject, body)
        .then(() => {
            let dataObj = {
                status: "success"
            };
        })
        .catch((error) => {
            let dataObj = {
                status: "fail"
            };
        })
}

function sendFormEmailToAdmin() {

    const subject = 'Order #' + orderNumber + ' - Awesome! You have just received an order'

    const body = `


<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html data-editor-version="2" class="sg-campaigns" xmlns="http://www.w3.org/1999/xhtml">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1">
      <!--[if !mso]><!-->
      <meta http-equiv="X-UA-Compatible" content="IE=Edge">
      <!--<![endif]-->
      <!--[if (gte mso 9)|(IE)]>
      <xml>
        <o:OfficeDocumentSettings>
          <o:AllowPNG/>
          <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
      </xml>
      <![endif]-->
      <!--[if (gte mso 9)|(IE)]>
  <style type="text/css">
    body {width: 600px;margin: 0 auto;}
    table {border-collapse: collapse;}
    table, td {mso-table-lspace: 0pt;mso-table-rspace: 0pt;}
    img {-ms-interpolation-mode: bicubic;}
  </style>
<![endif]-->
      <style type="text/css">
    body, p, div {
      font-family: arial,helvetica,sans-serif;
      font-size: 14px;
    }
    body {
      color: #000000;
    }
    body a {
      color: #0632FF;
      text-decoration: none;
    }
    p { margin: 0; padding: 0; }
    table.wrapper {
      width:100% !important;
      table-layout: fixed;
      -webkit-font-smoothing: antialiased;
      -webkit-text-size-adjust: 100%;
      -moz-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    img.max-width {
      max-width: 100% !important;
    }
    .column.of-2 {
      width: 50%;
    }
    .column.of-3 {
      width: 33.333%;
    }
    .column.of-4 {
      width: 25%;
    }
    ul ul ul ul  {
      list-style-type: disc !important;
    }
    ol ol {
      list-style-type: lower-roman !important;
    }
    ol ol ol {
      list-style-type: lower-latin !important;
    }
    ol ol ol ol {
      list-style-type: decimal !important;
    }
    @media screen and (max-width:480px) {
      .preheader .rightColumnContent,
      .footer .rightColumnContent {
        text-align: left !important;
      }
      .preheader .rightColumnContent div,
      .preheader .rightColumnContent span,
      .footer .rightColumnContent div,
      .footer .rightColumnContent span {
        text-align: left !important;
      }
      .preheader .rightColumnContent,
      .preheader .leftColumnContent {
        font-size: 80% !important;
        padding: 5px 0;
      }
      table.wrapper-mobile {
        width: 100% !important;
        table-layout: fixed;
      }
      img.max-width {
        height: auto !important;
        max-width: 100% !important;
      }
      a.bulletproof-button {
        display: block !important;
        width: auto !important;
        font-size: 80%;
        padding-left: 0 !important;
        padding-right: 0 !important;
      }
      .columns {
        width: 100% !important;
      }
      .column {
        display: block !important;
        width: 100% !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
        margin-left: 0 !important;
        margin-right: 0 !important;
      }
      .social-icon-column {
        display: inline-block !important;
      }
    }
  </style>
      <!--user entered Head Start--><!--End Head user entered-->
    </head>
    <body>
      <center class="wrapper" data-link-color="#0632FF" data-body-style="font-size:14px; font-family:arial,helvetica,sans-serif; color:#000000; background-color:#f5f5f5;">
        <div class="webkit">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" class="wrapper" bgcolor="#f5f5f5">
            <tr>
              <td valign="top" bgcolor="#f5f5f5" width="100%">
                <table width="100%" role="content-container" class="outer" align="center" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td width="100%">
                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td>
                            <!--[if mso]>
    <center>
    <table><tr><td width="600">
  <![endif]-->
                                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px;" align="center">
                                      <tr>
                                        <td role="modules-container" style="padding:0px 0px 0px 0px; color:#000000; text-align:left;" bgcolor="#FFFFFF" width="100%" align="left"><table class="module preheader preheader-hide" role="module" data-type="preheader" border="0" cellpadding="0" cellspacing="0" width="100%" style="display: none !important; mso-hide: all; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0;">
    <tr>
      <td role="module-content">
        <p></p>
      </td>
    </tr>
  </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="7e3f0f68-01d5-464d-a428-b491f380ea95" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:18px 0px 0px 0px; line-height:22px; text-align:inherit; background-color:#F5F5F5;" height="100%" valign="top" bgcolor="#F5F5F5" role="module-content"><div><div style="font-family: inherit; text-align: inherit"><br></div><div></div></div></td>
      </tr>
    </tbody>
  </table><table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" role="module" data-type="columns" style="padding:20px 20px 0px 20px;" bgcolor="#FFFFFF" data-distribution="1,1">
    <tbody>
      <tr role="module-content">
        <td height="100%" valign="top"><table width="270" style="width:270px; border-spacing:0; border-collapse:collapse; margin:0px 10px 0px 0px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-0">
      <tbody>
        <tr>
          <td style="padding:0px;margin:0px;border-spacing:0;"><table class="wrapper" role="module" data-type="image" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="ucgaSfbHNkf8izLL5yjyJe">
    <tbody>
      <tr>
        <td style="font-size:6px; line-height:10px; padding:0px 0px 0px 0px;" valign="top" align="left">
          
        <a clicktracking="off" href="https://www.unboxbasics.com/"><img class="max-width" border="0" style="display:block; color:#000000; text-decoration:none; font-family:Helvetica, arial, sans-serif; font-size:16px; max-width:100% !important; width:100%; height:auto !important;" width="270" alt="UNBOX Basics" data-proportionally-constrained="true" data-responsive="true" src="http://cdn.mcauto-images-production.sendgrid.net/7a4a3c716febe34f/081f6bcd-2956-418f-a4bd-c4e531b9cb9e/681x246.png"></a></td>
      </tr>
    </tbody>
  </table></td>
        </tr>
      </tbody>
    </table><table width="270" style="width:270px; border-spacing:0; border-collapse:collapse; margin:0px 0px 0px 10px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-1">
      <tbody>
        <tr>
          <td style="padding:0px;margin:0px;border-spacing:0;"><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="2NF1DMF9xHdSdPBr8a6Aan" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:18px 0px 18px 0px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: right"><b>Order #${orderNumber}</b></div>
<div style="font-family: inherit; text-align: right">${orderDate}</div>
<div style="font-family: inherit; text-align: right"><span style="color: #00bb04"><b>Status: ${paymentStatus}</b></span></div><div></div></div></td>
      </tr>
    </tbody>
  </table></td>
        </tr>
      </tbody>
    </table></td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="divider" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="86d635cd-7077-43cd-b0b3-a7c59b211c27.1.1">
    <tbody>
      <tr>
        <td style="padding:12px 20px 6px 20px;" role="module-content" height="100%" valign="top" bgcolor="">
          <table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" height="1px" style="line-height:1px; font-size:1px;">
            <tbody>
              <tr>
                <td style="padding:0px 0px 1px 0px;" bgcolor="#000000"></td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="ca4379fd-a8e1-4016-bb5e-15ebfbb4bda0.2.3.1" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:20px 20px 0px 20px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: inherit"><span style="font-size: 24px">You have a new shop order!</span></div><div></div></div></td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="ca4379fd-a8e1-4016-bb5e-15ebfbb4bda0.2.3.1.1.1" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:10px 20px 0px 20px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: inherit"><span style="font-size: 14px">Below are the details of your new shop order confirmation. We've sent a confirmation email to the customer along with their order details.</span></div><div></div></div></td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="ca4379fd-a8e1-4016-bb5e-15ebfbb4bda0.2.3.1.1" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:20px 20px 0px 20px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: inherit"><span style="font-size: 14px"><b>Payment Method</b></span></div>
<div style="font-family: inherit; text-align: inherit"><span style="font-size: 14px">${paymentMethod}</span></div><div></div></div></td>
      </tr>
    </tbody>
  </table><table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" role="module" data-type="columns" style="padding:20px 0px 30px 0px;" bgcolor="#FFFFFF" data-distribution="1,1">
    <tbody>
      <tr role="module-content">
        <td height="100%" valign="top"><table width="300" style="width:300px; border-spacing:0; border-collapse:collapse; margin:0px 0px 0px 0px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-0">
      <tbody>
        <tr>
          <td style="padding:0px;margin:0px;border-spacing:0;"><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="ca4379fd-a8e1-4016-bb5e-15ebfbb4bda0.1.3.2.3.1" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:10px 20px 0px 20px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: inherit"><span style="font-size: 14px; font-family: arial, helvetica, sans-serif"><b>Billing Information</b></span></div>
<div style="font-family: inherit; text-align: inherit"><span style="font-size: 14px; font-family: arial, helvetica, sans-serif">${customerFullName}</span></div>
<div style="font-family: inherit; text-align: inherit"><span style="font-size: 14px; font-family: arial, helvetica, sans-serif">${address}</span></div>
<div style="font-family: inherit; text-align: inherit"><span style="font-size: 14px; font-family: arial, helvetica, sans-serif">${cityCountry}</span></div>
<div style="font-family: inherit; text-align: inherit"><span style="font-size: 14px; font-family: arial, helvetica, sans-serif">${phone}, ${mobile}</span></div>
<div style="font-family: inherit; text-align: inherit"><span style="font-size: 14px; font-family: arial, helvetica, sans-serif">${email}</span></div><div></div></div></td>
      </tr>
    </tbody>
  </table></td>
        </tr>
      </tbody>
    </table><table width="300" style="width:300px; border-spacing:0; border-collapse:collapse; margin:0px 0px 0px 0px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-1">
      <tbody>
        <tr>
          <td style="padding:0px;margin:0px;border-spacing:0;"><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="ca4379fd-a8e1-4016-bb5e-15ebfbb4bda0.1.3.2.3.1.1" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:10px 20px 0px 20px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: inherit"><span style="font-size: 14px; font-family: arial, helvetica, sans-serif"><b>Delivery information</b></span></div>
<div style="font-family: inherit; text-align: inherit"><span style="font-size: 14px; font-family: arial, helvetica, sans-serif">${deliveryFullName}</span></div>
<div style="font-family: inherit; text-align: inherit"><span style="font-size: 14px; font-family: arial, helvetica, sans-serif">${address}</span></div>
<div style="font-family: inherit; text-align: inherit"><span style="font-size: 14px; font-family: arial, helvetica, sans-serif">${deliveryCityCountry}</span></div>
<div style="font-family: inherit; text-align: inherit"><span style="font-size: 14px; font-family: arial, helvetica, sans-serif">Delivery Schedule: ${deliveryMethod}}</span></div><div></div></div></td>
      </tr>
    </tbody>
  </table></td>
        </tr>
      </tbody>
    </table></td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="divider" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="86d635cd-7077-43cd-b0b3-a7c59b211c27.1.1.2">
    <tbody>
      <tr>
        <td style="padding:0px 20px 0px 20px;" role="module-content" height="100%" valign="top" bgcolor="">
          <table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" height="1px" style="line-height:1px; font-size:1px;">
            <tbody>
              <tr>
                <td style="padding:0px 0px 1px 0px;" bgcolor="#000000"></td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="ca4379fd-a8e1-4016-bb5e-15ebfbb4bda0.2.3.1.1.2" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:20px 20px 0px 20px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: inherit"><span style="font-size: 14px"><b>Items</b></span></div><div></div></div></td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="ca4379fd-a8e1-4016-bb5e-15ebfbb4bda0.3.1.1.1" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:10px 22px 26px 22px; line-height:22px; text-align:inherit; background-color:#ffffff;" height="100%" valign="top" bgcolor="#ffffff" role="module-content"><div><div style="font-family: inherit; text-align: inherit">${productList}</div><div></div></div></td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="divider" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="86d635cd-7077-43cd-b0b3-a7c59b211c27.1.1.1.1">
    <tbody>
      <tr>
        <td style="padding:0px 20px 0px 20px;" role="module-content" height="100%" valign="top" bgcolor="">
          <table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" height="1px" style="line-height:1px; font-size:1px;">
            <tbody>
              <tr>
                <td style="padding:0px 0px 1px 0px;" bgcolor="#000000"></td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table><table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" role="module" data-type="columns" style="padding:0px 0px 0px 0px;" bgcolor="#FFFFFF" data-distribution="2,1">
    <tbody>
      <tr role="module-content">
        <td height="100%" valign="top"><table width="400" style="width:400px; border-spacing:0; border-collapse:collapse; margin:0px 0px 0px 0px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-0">
      <tbody>
        <tr>
          <td style="padding:0px;margin:0px;border-spacing:0;"><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="ca4379fd-a8e1-4016-bb5e-15ebfbb4bda0.1.3.2.1.3.3" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:20px 20px 0px 20px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: right">Subtotal</div><div></div></div></td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="ca4379fd-a8e1-4016-bb5e-15ebfbb4bda0.1.3.2.1.2.1.3.1" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:0px 20px 0px 20px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: right">Discount ${couponId}</div><div></div></div></td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="ca4379fd-a8e1-4016-bb5e-15ebfbb4bda0.1.3.2.1.2.1.3.1.1" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:0px 20px 0px 20px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: right">Delivery Charge</div><div></div></div></td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="ca4379fd-a8e1-4016-bb5e-15ebfbb4bda0.1.3.2.1.2.1.2.1" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:0px 20px 0px 20px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: right">5% VAT</div><div></div></div></td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="ca4379fd-a8e1-4016-bb5e-15ebfbb4bda0.1.3.2.1.2.1.1.1.1" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:0px 20px 10px 20px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: right"><b>Total</b></div><div></div></div></td>
      </tr>
    </tbody>
  </table></td>
        </tr>
      </tbody>
    </table><table width="200" style="width:200px; border-spacing:0; border-collapse:collapse; margin:0px 0px 0px 0px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-1">
      <tbody>
        <tr>
          <td style="padding:0px;margin:0px;border-spacing:0;"><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="ca4379fd-a8e1-4016-bb5e-15ebfbb4bda0.1.3.2.1.1.2" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:20px 20px 0px 20px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: right">${subtotal}</div><div></div></div></td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="ca4379fd-a8e1-4016-bb5e-15ebfbb4bda0.1.3.2.1.1.1.1.2" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:0px 20px 0px 20px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: right">- ${discount}</div><div></div></div></td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="ca4379fd-a8e1-4016-bb5e-15ebfbb4bda0.1.3.2.1.1.2.1" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:0px 20px 0px 20px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: right">${deliveryCharges}</div><div></div></div></td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="ca4379fd-a8e1-4016-bb5e-15ebfbb4bda0.1.3.2.1.1.2.1.1" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:0px 20px 0px 20px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: right">${vat}</div><div></div></div></td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="ca4379fd-a8e1-4016-bb5e-15ebfbb4bda0.1.3.2.1.1.1.1.1" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:0px 20px 10px 20px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: right"><b>${total}</b></div><div></div></div></td>
      </tr>
    </tbody>
  </table></td>
        </tr>
      </tbody>
    </table></td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="divider" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="86d635cd-7077-43cd-b0b3-a7c59b211c27.1.1.1">
    <tbody>
      <tr>
        <td style="padding:0px 20px 0px 20px;" role="module-content" height="100%" valign="top" bgcolor="">
          <table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" height="1px" style="line-height:1px; font-size:1px;">
            <tbody>
              <tr>
                <td style="padding:0px 0px 1px 0px;" bgcolor="#000000"></td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="ca4379fd-a8e1-4016-bb5e-15ebfbb4bda0.2.3" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:30px 20px 20px 20px; line-height:22px; text-align:inherit; background-color:#ffffff;" height="100%" valign="top" bgcolor="#ffffff" role="module-content"><div><div style="font-family: inherit; text-align: inherit"><span style="font-size: 14px"><em><b>Notes</b></em></span></div>
<div style="font-family: inherit; text-align: inherit"><span style="font-size: 14px"><em>${request}</em></span></div><div></div></div></td>
      </tr>
    </tbody>
  </table><table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" role="module" data-type="columns" style="padding:0px 20px 0px 20px;" bgcolor="#FFFFFF" data-distribution="1,1">
    <tbody>
      <tr role="module-content">
        <td height="100%" valign="top"><table width="270" style="width:270px; border-spacing:0; border-collapse:collapse; margin:0px 10px 0px 0px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-0">
      <tbody>
        <tr>
          <td style="padding:0px;margin:0px;border-spacing:0;"><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="7a92ff1f-9e17-4b8a-a790-2444180a1ea3" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:18px 0px 18px 0px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: inherit"><span style="color: #000000">Contact: </span><a clicktracking="off" href="mailto:info@unboxbasics.com?subject=&amp;body="><span style="color: #000000">info@unboxbasics.com</span></a></div><div></div></div></td>
      </tr>
    </tbody>
  </table></td>
        </tr>
      </tbody>
    </table><table width="270" style="width:270px; border-spacing:0; border-collapse:collapse; margin:0px 0px 0px 10px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-1">
      <tbody>
        <tr>
          <td style="padding:0px;margin:0px;border-spacing:0;"><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="7a92ff1f-9e17-4b8a-a790-2444180a1ea3.1" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:18px 0px 18px 0px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: right"><a clicktracking="off" href="https://www.unboxbasics.com/"><span style="color: #000000; font-size: 18px">www.unboxbasics.com</span></a></div><div></div></div></td>
      </tr>
    </tbody>
  </table></td>
        </tr>
      </tbody>
    </table></td>
      </tr>
    </tbody>
  </table><div data-role="module-unsubscribe" class="module" role="module" data-type="unsubscribe" style="background-color:#f5f5f5; color:#a6a6a6; font-size:12px; line-height:20px; padding:16px 16px 16px 16px; text-align:Center;" data-muid="4e838cf3-9892-4a6d-94d6-170e474d21e5"><div class="Unsubscribe--addressLine"></div><p style="font-size:12px; line-height:20px;"><a target="_blank" class="Unsubscribe--unsubscribeLink zzzzzzz" clicktracking="off" href="{{{unsubscribe}}}" style="color:#a6a6a6;">Unsubscribe</a> - <a clicktracking="off" href="{{{unsubscribe_preferences}}}" target="_blank" class="Unsubscribe--unsubscribePreferences" style="color:#a6a6a6;">Unsubscribe Preferences</a></p></div></td>
                                      </tr>
                                    </table>
                                    <!--[if mso]>
                                  </td>
                                </tr>
                              </table>
                            </center>
                            <![endif]-->
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
      </center>
    </body>
  </html>

`;

    sendEmailToAdmin(subject, body)
        .then(() => {
            let dataObj = {
                status: "success"
            };
        })
        .catch((error) => {
            let dataObj = {
                status: "fail"
            };
        })
}