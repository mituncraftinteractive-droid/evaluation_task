# Copyright (c) 2026, mitun and contributors
# For license information, please see license.txt


import frappe

def execute(filters=None):

    columns = get_columns()
    data = get_data(filters)

    return columns, data


def get_columns():
    return [
        {
            "label": "Project Title",
            "fieldname": "project_title",
            "fieldtype": "Data",
            "width": 200
        },
        {
            "label": "Customer Name",
            "fieldname": "customer_name",
            "fieldtype": "Data",
            "width": 180
        },
        {
            "label": "Project Type",
            "fieldname": "project_type",
            "fieldtype": "Data",
            "width": 150
        },
        {
            "label": "Total Amount",
            "fieldname": "total_amount",
            "fieldtype": "Currency",
            "width": 150
        },
        {
            "label": "Status",
            "fieldname": "status",
            "fieldtype": "Data",
            "width": 120
        },
        {
            "label": "Date",
            "fieldname": "creation",
            "fieldtype": "Datetime",
            "width": 180
        }
    ]


def get_data(filters):

    conditions = "docstatus = 1"

    values = {}

    if filters:
        if filters.get("project_type"):
            conditions += " AND project_type = %(project_type)s"
            values["project_type"] = filters.get("project_type")

        if filters.get("from_date") and filters.get("to_date"):
            conditions += " AND creation BETWEEN %(from_date)s AND %(to_date)s"
            values["from_date"] = filters.get("from_date")
            values["to_date"] = filters.get("to_date")

    return frappe.db.sql(f"""
        SELECT
            project_title,
            customer_name,
            project_type,
            total_amount,
            status,
            creation
        FROM `tabJob Quotation`
        WHERE {conditions}
        ORDER BY creation DESC
    """, values, as_dict=True)