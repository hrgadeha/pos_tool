# -*- coding: utf-8 -*-
# Copyright (c) 2019, Hardik Gadesha and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe import _
from erpnext.controllers.accounts_controller import get_taxes_and_charges
from frappe import msgprint
from frappe.model.document import Document
from frappe.utils import money_in_words

class POSTool(Document):
	def on_submit(self):
		control_amount = frappe.db.get_single_value('POS Amount Setting', 'control_amount')
		value = int(control_amount)
		items = []
		amount = 0
		last_qty = -1
		for d in self.pos_tool_item:
			for i in range(d.qty):
				amount = amount + d.rate
				if(amount > value):
					amount = amount-d.rate
					if(last_qty>0):
						items.append({"item_code": d.item_code,"qty": i-last_qty,"rate": d.rate,"warehouse":d.warehouse})
					else:
						items.append({"item_code": d.item_code,"qty": i,"rate": d.rate,"warehouse":d.warehouse})
					last_qty = i;
					sales_invoice = frappe.get_doc({
					"doctype": "Sales Invoice", 
					"customer": self.customer_name, 
					"posting_date": self.posting_date,
					"total":amount,
					"taxes_and_charges":self.taxes,
					"created_from":self.name,
					"items": items
					})
					if sales_invoice.taxes_and_charges:
						getTax(sales_invoice)
					sales_invoice.calculate_taxes_and_totals()
					sales_invoice.insert(ignore_permissions=True)
					#calculate_taxes_and_totals()
					sales_invoice.save()
					amount = d.rate
					items = []
			if(last_qty>0):
				items.append({"item_code": d.item_code,"qty": d.qty-last_qty,"rate": d.rate,"warehouse":d.warehouse})
			else:
				items.append({"item_code": d.item_code,"qty": d.qty,"rate": d.rate,"warehouse":d.warehouse})
			last_qty = -1

		if(amount > 0):
			sales_invoice= frappe.get_doc({
			"doctype": "Sales Invoice", 
			"customer": self.customer_name, 
			"posting_date": self.posting_date,
			"total":amount,
			"taxes_and_charges":self.taxes,
			"created_from":self.name,
			"items": items
			})
			if sales_invoice.taxes_and_charges:
				getTax(sales_invoice)
         		sales_invoice.calculate_taxes_and_totals()
			sales_invoice.insert(ignore_permissions=True)
			#res.calculate_taxes_and_totals()
			sales_invoice.save()

	def submit_all_invoice(self):
		for d in self.created_sales_invoice_using_pos_tool:
			frappe.msgprint(frappe._("Sales Invoice {0} Submitted").format(d.sales_invoice))
			sv = frappe.get_doc("Sales Invoice",d.sales_invoice)
			sv.docstatus = 1
			#sv.save()
			sv.submit()

@frappe.whitelist(allow_guest=True)
def getStockBalance(item_code, warehouse):
	balance_qty = frappe.db.sql("""select qty_after_transaction from `tabStock Ledger Entry`
		where item_code=%s and warehouse=%s and is_cancelled='No'
		order by posting_date desc, posting_time desc, name desc
		limit 1""",(item_code,warehouse))
	return balance_qty[0][0] if balance_qty else 0.0


@frappe.whitelist(allow_guest=True)
def insert_data(doctype, name):
	query="select name,status,taxes_and_charges,grand_total from `tabSales Invoice` where created_from = '"+str(name)+"';"
	li=[]
	dic=frappe.db.sql(query, as_dict=True)
	for i in dic:
		name,status,taxes_and_charges,grand_total=i['name'],i['status'],i['taxes_and_charges'],i['grand_total']
		li.append([name,status,taxes_and_charges,grand_total])
	return li

@frappe.whitelist()
def getTax1(name):
	doc=frappe.get_doc("Sales Taxes and Charges Template",name)
	tax=[]
	for row in doc.taxes:
		tax_json={}
		tax_json["account_head"]=row.account_head
		tax_json["description"]=row.description
		tax_json["charge_type"]=row.charge_type
		tax_json["rate"]=row.rate
		tax.append(tax_json)
	return tax

@frappe.whitelist()
def getTax(sales_invoice):
	taxes = get_taxes_and_charges('Sales Taxes and Charges Template',sales_invoice.taxes_and_charges)
	for tax in taxes:
		sales_invoice.append('taxes', tax)
