import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { useCategoryStore } from "../../store/useCategoryStore.js";
import EditCategoryForm from "../../components/admin/category/EditCategoryForm.jsx";

const EditCategory = () => {
  const { slug } = useParams();

  const {
    getOneCategory,
    loading,
    error,
  } = useCategoryStore();

  const [data, setData] = useState(null);

  // =========================
  // FETCH CATEGORY
  // =========================
  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const category = await getOneCategory(slug);

        setData(category);

      } catch (err) {
        console.log(err);
      }
    };

    fetchCategory();
  }, [slug]);

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading category...
      </div>
    );
  }

  // =========================
  // ERROR
  // =========================
  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        {error}
      </div>
    );
  }

  // =========================
  // NOT FOUND
  // =========================
  if (!data) {
    return (
      <div className="p-6 text-center text-red-500">
        Category not found
      </div>
    );
  }

  // =========================
  // RENDER FORM
  // =========================
  return (
    <EditCategoryForm />
  );
};

export default EditCategory;

