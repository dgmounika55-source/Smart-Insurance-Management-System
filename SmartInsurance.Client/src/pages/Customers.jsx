import { useEffect, useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import api from "../services/api";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await api.get("/customers");
        setCustomers(response.data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
          (err.response?.status === 403
            ? "You do not have permission to view customers."
            : "Unable to load customers. Please log in with an Admin or Claims Manager account.")
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const term = search.toLowerCase();

    return customers.filter((customer) =>
      [
        customer.fullName,
        customer.email,
        customer.phoneNumber
      ].some((value) => (value || "").toLowerCase().includes(term))
    );
  }, [customers, search]);

  return (
    <div className="page-section">
      <div className="page-title-row consistent-page-header">
        <div>
          <div className="page-breadcrumb">MANAGEMENT / CUSTOMERS</div>
          <h1>Customers</h1>
          <p>View registered customers and their policy details.</p>
        </div>
      </div>

      <div className="panel">
        <div className="page-toolbar">
          <div className="search-box">
            <Search size={17} />
            <input
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span>{customers.length} customers</span>
        </div>

        {loading ? (
          <p className="page-message">Loading customers...</p>
        ) : error ? (
          <p className="page-message error-message">{error}</p>
        ) : filteredCustomers.length === 0 ? (
          <p className="page-message">No customers found.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>CUSTOMER ID</th>
                  <th>FULL NAME</th>
                  <th>EMAIL</th>
                  <th>PHONE</th>
                  <th>POLICIES</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.customerId}>
                    <td className="claim-id">
                      CUS-{String(customer.customerId).padStart(3, "0")}
                    </td>
                    <td className="customer-name">{customer.fullName}</td>
                    <td>{customer.email}</td>
                    <td>{customer.phoneNumber || "—"}</td>
                    <td className="amount">
                      {customer.customerPolicies?.length ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
