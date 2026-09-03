import { useState } from "react";

import { X, Package } from "lucide-react";

import { useInquiryStore } from "../../store/useInquiryStore.js";

const RequestQuoteModal = ({ product, onClose }) => {
  const { createInquiry, loading } = useInquiryStore();

  const [formData, setFormData] = useState({
    customerName: "",
    email: "",
    phone: "",
    company: "",
    quantity: 1,
    message: "",
  });

  // HANDLE CHANGE

  const handleChange = (e) => {
    setFormData({
      ...formData,

      [e.target.name]: e.target.value,
    });
  };

  // SUBMIT

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await createInquiry({
        product: product._id,

        productName: product.name,

        productSlug: product.slug,

        category: product.category?.name,

        ...formData,
      });

      alert("Inquiry submitted successfully");

      onClose();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div
      className="
    fixed
    inset-0
    z-50
    bg-black/60
    backdrop-blur-sm
    flex
    items-center
    justify-center
    p-4
  "
    >
      {/* MODAL */}

      <div
        className="
      relative
      bg-white
      rounded-3xl
      w-full
      max-w-6xl
      max-h-[95vh]
      overflow-y-auto
      shadow-2xl
    "
      >
        {/* CLOSE BUTTON */}

        <button
          onClick={onClose}
          className="
        absolute
        top-5
        right-5
        z-10
        h-10
        w-10
        rounded-full
        bg-gray-100
        hover:bg-red-100
        flex
        items-center
        justify-center
        transition
      "
        >
          <X className="w-5 h-5" />
        </button>

        <div
          className="
        grid
        grid-cols-1
        lg:grid-cols-2
      "
        >
          {/* LEFT PRODUCT PREVIEW */}

          <div
            className="
          bg-gray-50
          p-8
          border-r
          border-gray-100
        "
          >
            <div
              className="
            sticky
            top-0
          "
            >
              <div
                className="
              rounded-3xl
              overflow-hidden
              bg-white
              border
              border-gray-100
            "
              >
                <img
                  src={product.images?.[0]}
                  alt={product.name}
                  className="
                w-full
                h-[350px]
                object-cover
              "
                />
              </div>

              <div className="mt-6">
                <span
                  className="
                inline-block
                bg-[#021C57]
                text-white
                text-xs
                px-4
                py-2
                rounded-full
                mb-4
              "
                >
                  {product.category?.name}
                </span>

                <h2
                  className="
                text-3xl
                font-bold
                text-[#021C57]
                leading-tight
              "
                >
                  {product.name}
                </h2>

                <p
                  className="
                mt-4
                text-gray-600
                leading-relaxed
              "
                >
                  {product.description}
                </p>

                {/* FEATURES */}

                {product.features?.length > 0 && (
                  <div className="mt-6">
                    <h3
                      className="
                    font-semibold
                    text-[#021C57]
                    mb-3
                  "
                    >
                      Features
                    </h3>

                    <div
                      className="
                    flex
                    flex-wrap
                    gap-2
                  "
                    >
                      {product.features.map((feature, index) => (
                        <span
                          key={index}
                          className="
                        px-3
                        py-2
                        rounded-full
                        bg-blue-50
                        text-[#021C57]
                        text-sm
                      "
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT FORM */}

          <div className="p-8">
            <div className="mb-8">
              <div
                className="
              flex
              items-center
              gap-3
              mb-4
            "
              >
                <div
                  className="
                h-12
                w-12
                rounded-2xl
                bg-blue-50
                flex
                items-center
                justify-center
              "
                >
                  <Package
                    className="
                  w-6
                  h-6
                  text-[#021C57]
                "
                  />
                </div>

                <div>
                  <h2
                    className="
                  text-3xl
                  font-bold
                  text-[#021C57]
                "
                  >
                    Request Quote
                  </h2>

                  <p className="text-gray-500">
                    Fill the form to get pricing details.
                  </p>
                </div>
              </div>
            </div>

            {/* FORM */}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* NAME */}

              <div>
                <label
                  className="
                block
                mb-2
                font-medium
                text-gray-700
              "
                >
                  Full Name
                </label>

                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  required
                  className="
                w-full
                border
                border-gray-200
                rounded-2xl
                px-5
                py-4
                outline-none
                focus:ring-2
                focus:ring-blue-200
              "
                />
              </div>

              {/* EMAIL */}

              <div>
                <label
                  className="
                block
                mb-2
                font-medium
                text-gray-700
              "
                >
                  Email Address
                </label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="
                w-full
                border
                border-gray-200
                rounded-2xl
                px-5
                py-4
                outline-none
                focus:ring-2
                focus:ring-blue-200
              "
                />
              </div>

              {/* PHONE */}

              <div>
                <label
                  className="
                block
                mb-2
                font-medium
                text-gray-700
              "
                >
                  Phone Number
                </label>

                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="
                w-full
                border
                border-gray-200
                rounded-2xl
                px-5
                py-4
                outline-none
                focus:ring-2
                focus:ring-blue-200
              "
                />
              </div>

              {/* COMPANY */}

              <div>
                <label
                  className="
                block
                mb-2
                font-medium
                text-gray-700
              "
                >
                  Company Name
                </label>

                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="
                w-full
                border
                border-gray-200
                rounded-2xl
                px-5
                py-4
                outline-none
                focus:ring-2
                focus:ring-blue-200
              "
                />
              </div>

              {/* QUANTITY */}

              <div>
                <label
                  className="
                block
                mb-2
                font-medium
                text-gray-700
              "
                >
                  Quantity
                </label>

                <input
                  type="number"
                  name="quantity"
                  min="1"
                  value={formData.quantity}
                  onChange={handleChange}
                  className="
                w-full
                border
                border-gray-200
                rounded-2xl
                px-5
                py-4
                outline-none
                focus:ring-2
                focus:ring-blue-200
              "
                />
              </div>

              {/* MESSAGE */}

              <div>
                <label
                  className="
                block
                mb-2
                font-medium
                text-gray-700
              "
                >
                  Message
                </label>

                <textarea
                  rows="5"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="
                Tell us your requirements...
              "
                  className="
                w-full
                border
                border-gray-200
                rounded-2xl
                px-5
                py-4
                outline-none
                resize-none
                focus:ring-2
                focus:ring-blue-200
              "
                />
              </div>

              {/* BUTTON */}

              <button
                type="submit"
                disabled={loading}
                className="
              w-full
              bg-[#021C57]
              hover:bg-[#03308f]
              text-white
              py-4
              rounded-2xl
              font-semibold
              transition-all
              duration-300
              disabled:opacity-50
            "
              >
                {loading ? "Submitting..." : "Submit Inquiry"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestQuoteModal;
