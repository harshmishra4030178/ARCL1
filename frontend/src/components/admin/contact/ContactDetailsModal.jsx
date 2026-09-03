import {
X,
Mail,
Calendar,
MessageSquare,
User,
} from "lucide-react";

const ContactDetailsModal = ({
contact,
onClose,
}) => {

if (!contact) return null;

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
      max-w-3xl
      max-h-[90vh]
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


    {/* HEADER */}

    <div
      className="
        p-8
        border-b
        border-gray-100
      "
    >

      <h2
        className="
          text-3xl
          font-bold
          text-[#021C57]
        "
      >
        Contact Details
      </h2>

      <p className="text-gray-500 mt-2">
        Complete customer message information
      </p>

    </div>


    {/* CONTENT */}

    <div className="p-8 space-y-8">

      {/* CUSTOMER INFO */}

      <div>

        <h3
          className="
            text-xl
            font-semibold
            text-[#021C57]
            mb-5
          "
        >
          Customer Information
        </h3>


        <div
          className="
            grid
            grid-cols-1
            md:grid-cols-2
            gap-5
          "
        >

          {/* NAME */}

          <div
            className="
              border
              border-gray-100
              rounded-2xl
              p-5
            "
          >

            <div className="flex items-center gap-2">

              <User
                className="
                  w-4
                  h-4
                  text-gray-400
                "
              />

              <p className="text-sm text-gray-500">
                Name
              </p>

            </div>

            <h4
              className="
                mt-2
                font-semibold
                text-[#021C57]
              "
            >
              {contact.name}
            </h4>

          </div>


          {/* EMAIL */}

          <div
            className="
              border
              border-gray-100
              rounded-2xl
              p-5
            "
          >

            <div className="flex items-center gap-2">

              <Mail
                className="
                  w-4
                  h-4
                  text-gray-400
                "
              />

              <p className="text-sm text-gray-500">
                Email
              </p>

            </div>

            <h4
              className="
                mt-2
                font-semibold
                text-[#021C57]
                break-all
              "
            >
              {contact.email}
            </h4>

          </div>

        </div>

      </div>


      {/* SUBJECT */}

      <div>

        <h3
          className="
            text-xl
            font-semibold
            text-[#021C57]
            mb-5
          "
        >
          Subject
        </h3>

        <div
          className="
            border
            border-gray-100
            rounded-3xl
            p-6
            bg-gray-50
          "
        >

          <div className="flex gap-3">

            <Mail
              className="
                w-5
                h-5
                text-gray-400
                mt-1
              "
            />

            <p
              className="
                text-gray-700
                leading-relaxed
                font-medium
              "
            >
              {contact.subject}
            </p>

          </div>

        </div>

      </div>


      {/* MESSAGE */}

      <div>

        <h3
          className="
            text-xl
            font-semibold
            text-[#021C57]
            mb-5
          "
        >
          Customer Message
        </h3>

        <div
          className="
            border
            border-gray-100
            rounded-3xl
            p-6
            bg-gray-50
          "
        >

          <div className="flex gap-3">

            <MessageSquare
              className="
                w-5
                h-5
                text-gray-400
                mt-1
              "
            />

            <p
              className="
                text-gray-700
                leading-relaxed
                whitespace-pre-line
              "
            >
              {
                contact.message ||
                "No message provided"
              }
            </p>

          </div>

        </div>

      </div>


      {/* META */}

      <div>

        <h3
          className="
            text-xl
            font-semibold
            text-[#021C57]
            mb-5
          "
        >
          Message Metadata
        </h3>

        <div
          className="
            border
            border-gray-100
            rounded-3xl
            p-6
            space-y-5
          "
        >

          {/* STATUS */}

          <div
            className="
              flex
              items-center
              justify-between
            "
          >

            <p className="text-gray-500">
              Status
            </p>

            <span
              className={`
                px-4
                py-2
                rounded-full
                text-sm
                font-medium

                ${
                  contact.status ===
                  "unread"

                    ? "bg-yellow-100 text-yellow-700"

                    : contact.status ===
                      "read"

                    ? "bg-blue-100 text-blue-700"

                    : "bg-green-100 text-green-700"
                }
              `}
            >

              {contact.status}

            </span>

          </div>


          {/* DATE */}

          <div
            className="
              flex
              items-center
              justify-between
            "
          >

            <div className="flex items-center gap-2">

              <Calendar
                className="
                  w-5
                  h-5
                  text-gray-400
                "
              />

              <p className="text-gray-500">
                Submitted On
              </p>

            </div>

            <p
              className="
                font-medium
                text-[#021C57]
              "
            >
              {
                new Date(
                  contact.createdAt
                ).toLocaleString()
              }
            </p>

          </div>

        </div>

      </div>

    </div>

  </div>

</div>
  

);
};

export default ContactDetailsModal;
