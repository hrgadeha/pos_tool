// Copyright (c) 2019, Hardik Gadesha and contributors
// For license information, please see license.txt

frappe.ui.form.on('POS Tool', {
	refresh: function(frm) {

	}
});

// Copyright (c) 2019, Hardik Gadesha and contributors
// For license information, please see license.txt

frappe.ui.form.on('POS Tool', {
	"additional_discount_type": function(frm) {
		frm.set_value("additional_discount_amount", "");
		frm.set_value("additional_discount_percentage", "");
	}
});

cur_frm.add_fetch("item_code","item_name","item_name")
cur_frm.add_fetch("item_code","description","description")
cur_frm.add_fetch("item_code","standard_rate","rate")
cur_frm.add_fetch("item_code","stock_uom","uom")
cur_frm.add_fetch("item_code","standard_rate","rate")
cur_frm.add_fetch("item_code","standard_rate","rate")
cur_frm.add_fetch("item_code","standard_rate","rate")



frappe.ui.form.on("POS Tool Item", {
	"qty": function(frm, cdt, cdn) {	
		cur_frm.refresh();
		cur_frm.refresh_fields();
		var d = locals[cdt][cdn];
		frappe.model.set_value(d.doctype, d.name, "amount", (d.qty * d.rate));
		var total = 0;
		var sales_invoice = frm.doc.pos_tool_item;

   	for(var i in sales_invoice) {
		total = total + sales_invoice[i].amount;
		frm.set_value("grand_total", total);
	}
	}
});

frappe.ui.form.on("POS Tool Item", {
	"rate": function(frm, cdt, cdn) {
		cur_frm.refresh();
		cur_frm.refresh_fields();
		var d = locals[cdt][cdn];
		frappe.model.set_value(d.doctype, d.name, "amount", (d.qty * d.rate));
		var total = 0;
		var sales_invoice = frm.doc.pos_tool_item;

   	for(var i in sales_invoice) {
		total = total + sales_invoice[i].amount;
		frm.set_value("grand_total", total);
	}
}
});

frappe.ui.form.on("POS Tool Item", {
	"pos_tool_item_remove": function(frm, cdt, cdn) {
		cur_frm.refresh();
		cur_frm.refresh_fields();
		var d = locals[cdt][cdn];
		var total = 0;
		var sales_invoice = frm.doc.pos_tool_item;
		console.log(total)

   	for(var i in sales_invoice) {
		total = total + sales_invoice[i].amount;
		frm.set_value("net_total", total);
	}
}
});

frappe.ui.form.on("POS Tool Item",{
	"item_code" : function (frm, cdt, cdn){
	var d2 = locals[cdt][cdn];
	if(d2.warehouse){
	frappe.call({
		"method": "pos_tool.pos_tool.doctype.pos_tool.pos_tool.getStockBalance",
		args: {
			item_code: d2.item_code,
			warehouse: d2.warehouse
		},
		callback:function(r){
		var myJSON = JSON.stringify(r);
		var myJSONnew = myJSON.match(/\d+/g).map(Number);
		msgprint(d2.item_code+ " has Stock QTY : " +myJSONnew+ " in Warehouse : " +d2.warehouse)
;}
});
}
}
});

frappe.ui.form.on("POS Tool Item",{
	"warehouse" : function (frm, cdt, cdn){
	var d2 = locals[cdt][cdn];
	if(d2.item_code){
	frappe.call({
		"method": "pos_tool.pos_tool.doctype.pos_tool.pos_tool.getStockBalance",
		args: {
			item_code: d2.item_code,
			warehouse: d2.warehouse
		},
		callback:function(r){
		var myJSON = JSON.stringify(r);
		var myJSONnew = myJSON.match(/\d+/g).map(Number);
		msgprint(d2.item_code+ " has Stock QTY : " +myJSONnew+ " in Warehouse : " +d2.warehouse)
;}
});
}
}
});


frappe.ui.form.on("POS Tool", {
  "gate_sales_invoice_list": function(frm) {
	cur_frm.refresh();
	cur_frm.clear_table("created_sales_invoice_using_pos_tool");
	cur_frm.refresh_fields();
	
    frappe.call({
    "method": "pos_tool.pos_tool.doctype.pos_tool.pos_tool.insert_data",
args: {
doctype: "Sales Invoice",
name: frm.doc.name
},
callback:function(r){
	var len=r.message.length;
	for (var i=0;i<len;i++){
	        var row = frm.add_child("created_sales_invoice_using_pos_tool");
		row.sales_invoice = r.message[i][0];
		row.status = r.message[i][1];
		row.tax_template = r.message[i][2];
		row.bill_amount = r.message[i][3];
	}
		cur_frm.refresh();
	}
    });
}
});

cur_frm.cscript.submit_all_invoice = function(doc, cdt, cdn) {
		return $c('runserverobj', {'method':'submit_all_invoice', 'docs':doc},
			function(r, rt) {
			});
}
