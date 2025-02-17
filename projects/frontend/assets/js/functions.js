let toast;

function addToast() {
  if ($('.toast-container').length === 0) {
    $('.container').append(`
      <!-- Toast container -->
      <div class="toast-container position-fixed bottom-0 end-0 p-3">
        <div id="toast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
          <div class="toast-header">
            <strong class="me-auto" id="toastTitle">Notification</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
          <div class="toast-body" id="toastMessage"></div>
        </div>
      </div>
    `)

    toast = new bootstrap.Toast(document.getElementById('toast'));
  }
}

function showToast(message, isError = false) {
  $('#toastTitle').text(isError ? 'Error' : 'Success');
  $('#toastMessage').text(message);
  $('#toast').removeClass('bg-danger text-white bg-success');
  $('#toast').addClass(isError ? 'bg-danger text-white' : 'bg-success text-white');
  toast.show();
}

function loadCustomers(callback) {
  $.ajax({
    url: 'http://localhost:3000/customers',
    type: 'GET',
    success: function(response) {
      callback(response);
    },
    error: function(xhr) {
      showToast(xhr.responseJSON.message, true);
    }
  });
}

function saveCustomer(customer, callback) {
  $.ajax({
    url: 'http://localhost:3000/customers',
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(customer),
    success: function(response) {
      callback(response);
    },
    error: function(xhr) {
      showToast(xhr.responseJSON.message, true);
    }
  });
}

function savePayment(payment, callback) {
  $.ajax({
    url: 'http://localhost:3000/payments',
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(payment),
    success: function(response) {
      callback(response);
    },
    error: function(xhr) {
      showToast(xhr.responseJSON.message, true);
    }
  });
}

function loadCustomer(customerId, callback) {
  $.ajax({
    url: `http://localhost:3000/customers/${customerId}`,
    type: 'GET',
    success: function(customer) {
      callback(customer);
    },
    error: function(xhr) {
      showToast(xhr.responseJSON.message, true);
    }
  });
}

function loadPayments(customerId, callback) {
  $.ajax({
    url: `http://localhost:3000/payments/customer/${customerId}`,
    type: 'GET',
    success: function(payments) {
      callback(payments);
    },
    error: function(xhr) {
      showToast(xhr.responseJSON.message, true);
    }
  });
}

function handleWebhook(payment, callback) {
  const webhook = {
    event: "PAYMENT_RECEIVED",
    payment: {
        id: payment.id,
        customer: payment.customer,
        value: payment.value,
        netValue: payment.netValue,
        billingType: payment.billingType,
        status: payment.status,
        dueDate: payment.dueDate,
        paymentDate: new Date().toISOString().split('T')[0]
    }
  }

  $.ajax({
    url: `http://localhost:3000/payments/webhook`,
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(webhook),
    success: function(response) {
      showToast('Webhook recebido com sucesso!');
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    },
    error: function(xhr) {
      showToast(xhr.responseJSON.message, true);
    }
  });
}
