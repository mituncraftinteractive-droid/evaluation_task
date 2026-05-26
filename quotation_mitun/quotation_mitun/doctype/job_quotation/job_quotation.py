# Copyright (c) 2026, mitun and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.model.naming import make_autoname
from datetime import datetime
class JobQuotation(Document):
    def before_save(self):
        created_by = self.get("__created_by")
        if not created_by:
            self.created_by = frappe.session.user
        created_on = self.get("__created_on")
        if not created_on:
            self.created_on = frappe.utils.now()

    def validate(self):
        if self.total_amount == 0:
            frappe.throw("Total Amount cannot be zero")

        for row in self.items:
            if not row.task_description:
                frappe.throw("Task Description is required in all rows")

    def autoname(self):
        project = frappe.scrub(self.project_title)
        mmyy = datetime.now().strftime("%m%y")

        prefix = f"{project}-QT-{mmyy}"

        records = frappe.db.get_list(
            "Job Quotation",
            filters={
                "name": ["like", f"%QT-{mmyy}-%"]
            },
            fields=["name"]
        )

        max_number = 0

        for r in records:
            try:
                last_part = r.name.split("-")[-1]
                number = int(''.join(filter(str.isdigit, last_part)) or 0)

                if number > max_number:
                    max_number = number

            except:
                continue

        next_number = max_number + 1

        self.name = f"{prefix}-{str(next_number).zfill(3)}"
@frappe.whitelist()
def update_job_status(docname, status):

    doc = frappe.get_doc("Job Quotation", docname)

    # safety check
    if doc.docstatus != 1:
        frappe.throw("Only submitted documents can be updated")

    if status not in ["Completed", "Cancelled"]:
        frappe.throw("Invalid status")

    doc.status = status
    doc.save(ignore_permissions=True)

    return "ok"