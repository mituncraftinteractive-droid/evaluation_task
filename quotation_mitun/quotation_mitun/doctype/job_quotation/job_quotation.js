frappe.ui.form.on('Job Quotation', {
    before_save: function(frm) {
        calculate_totals(frm);
    },
    before_workflow_action: async function(frm) {
        let current_action = frm.selected_workflow_action;
        if (current_action === "submit") {
           
            frappe.dom.unfreeze();
            await new Promise((resolve, reject) => {
                let dialog = new frappe.ui.Dialog({
                    title: 'Confirm Submission',
                    fields: [
                        {
                            fieldtype: 'Data',
                            label: 'Project Title',
                            fieldname: 'project_title',
                            default: frm.doc.project_title,
                            read_only: 1
                        },
                        {
                            fieldtype: 'Data',
                            label: 'Project Type',
                            fieldname: 'project_type',
                            default: frm.doc.project_type,
                            read_only: 1
                        },
                        {
                            fieldtype: 'Int',
                            label: 'Total Quantity',
                            fieldname: 'total_quantity',
                            default: frm.doc.total_quantity || 0,
                            read_only: 1
                        },
                        {
                            fieldtype: 'Currency',
                            label: 'Total Amount',
                            fieldname: 'total_amount',
                            default: frm.doc.total_amount || 0,
                            read_only: 1
                        }
                    ],
                    primary_action_label: 'Confirm',
                    primary_action: function() {
                        dialog.hide();
                        resolve();

                        frappe.show_alert({
                            message: __('Job Quotation Submitted'),
                            indicator: 'green'
                        });
                    },
                    secondary_action_label: 'Back',
                    secondary_action: function() {
                        dialog.hide();
                        frappe.call({
                            method: "frappe.client.set_value",
                            args: {
                                doctype: frm.doc.doctype,
                                name: frm.doc.name,
                                fieldname: "workflow_state",
                                value: "Draft"
                            },
                            callback: function() {
                                frm.reload_doc();
                                frappe.show_alert({
                                    message: __('Returned to Draft'),
                                    indicator: 'orange'
                                });
                            }
                        });
                        reject();
                    }
                });
                dialog.show();
            }).catch((e) => {
                throw e;
            });

            frappe.validated = false;
        }
    },
     refresh: function(frm) {
        frm.get_field('items').grid.cannot_add_rows = true;
        // frm.get_field('items').grid.cannot_delete_rows = true;
        frm.refresh_field('items');
        frm.get_field('items').grid.wrapper.find('.grid-remove-rows').hide();


        calculate_totals(frm);

        if (frm.doc.docstatus === 1) {

            frm.add_custom_button(__('Change Status'), function() {

                let d = new frappe.ui.Dialog({
                    title: 'Change Status',
                    fields: [
                        {
                            fieldtype: 'Select',
                            label: 'Status',
                            fieldname: 'status',
                            options: ['Completed', 'Cancelled'],
                            reqd: 1
                        }
                    ],
                    primary_action_label: 'Update',
                    primary_action(values) {

                        frappe.call({
                            method: "quotation_mitun.quotation_mitun.doctype.job_quotation.job_quotation.update_job_status", 
                            args: {
                                docname: frm.doc.name,
                                status: values.status
                            },
                            callback: function(r) {
                                if (!r.exc) {
                                    frm.reload_doc();
                                    frappe.show_alert({
                                        message: __('Status Updated Successfully'),
                                        indicator: 'green'
                                    });
                                }
                            }
                        });

                        d.hide();
                    }
                });

                d.show();
            });
        }
    },
    start_date: calculate_duration,
    end_date: calculate_duration,
    onload: function(frm) {
        calculate_totals(frm);
        frm.set_query('unit', 'items', function() {
            return {
                filters: {
                    name: ['in', ['sq.ft', 'hrs', 'pcs']]
                }
            };
        });
    },
     quantity: function(frm, cdt, cdn) {
        calculate_totals(frm);
    },
    amount: function(frm, cdt, cdn) {
        calculate_totals(frm);
    },
    setup: function(frm) {
        frm.set_query("quotation", function() {

            return {
                filters: {
                    party_name: frm.doc.customer_name
                }
            };
        });
    },
    quotation(frm) {

         if (!frm.doc.quotation) {
            return; 
        }

        if (!frm.doc.customer_name) {
            frappe.msgprint("Please select Customer first");
            frm.set_value('quotation', ''); 
            return;
        }
        if (frm.doc.quotation) {
            frappe.call({
                method: "frappe.client.get",
                args: {
                    doctype: "Quotation",
                    name: frm.doc.quotation
                },
                callback: function(r) {
                    if (r.message) {
                        frm.clear_table("items");
                        (r.message.items || []).forEach(item => {

                            let row = frm.add_child("items");
                            row.item_code = item.item_code;
                            row.quantity = item.qty;
                            row.rate = item.rate;
                            row.amount = item.amount;
                        });
                        frm.refresh_field("items");
                    }
                }
            });
        }
    },
    
});

function calculate_duration(frm) {
    if (frm.doc.start_date && frm.doc.end_date) {

        if (frm.doc.end_date < frm.doc.start_date) {
            frappe.msgprint("End Date cannot be earlier than Start Date");
            frm.set_value('end_date', "");
            return;
        }
        let diff = frappe.datetime.get_day_diff(
            frm.doc.end_date,
            frm.doc.start_date
        );
        frm.set_value('duration', diff);
    }
}

function calculate_totals(frm) {
    let total_qty = 0;
    let total_amount = 0;
    (frm.doc.items || []).forEach(row => {
        total_qty += flt(row.quantity);
        total_amount += flt(row.amount);
    });
    frm.set_value('total_quantity', total_qty);
    frm.set_value('total_amount', total_amount);
    frm.refresh_field('total_quantity');
    frm.refresh_field('total_amount');
}

frappe.ui.form.on('Job Quotation Item', {
    form_render(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        frm.fields_dict.items.grid.get_field('unit').get_query = function() {

            return {
                filters: {
                    name: ['in', ['sq.ft', 'hrs', 'pcs']]
                }
            };
        };
        
    },
    
});
