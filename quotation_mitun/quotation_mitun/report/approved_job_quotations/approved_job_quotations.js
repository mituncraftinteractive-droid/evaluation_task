// Copyright (c) 2026, mitun and contributors
// For license information, please see license.txt

frappe.query_reports["Approved Job Quotations"] = {
    filters: [
        {
            fieldname: "project_type",
            label: "Project Type",
            fieldtype: "Select",
            options: [
				"",
                "Interior",
                "Exterior",
                "Landscaping",
				"Electrical"
            ]
        },
        {
            fieldname: "from_date",
            label: "From Date",
            fieldtype: "Date",
            // reqd: 1
        },
        {
            fieldname: "to_date",
            label: "To Date",
            fieldtype: "Date",
            // reqd: 1
        }
    ]
};