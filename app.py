import streamlit as st

st.set_page_config(page_title="QuXAT Self Assessment (QSA)", layout="wide")
st.title("QuXAT Self Assessment (QSA)")
st.caption("Embedded User and Admin pages served locally")

tabs = st.tabs(["User", "Admin"]) 

with tabs[0]:
    st.subheader("User Page")
    st.components.v1.html(
        '<iframe src="http://localhost:8000/user.html" style="width:100%; height:1000px; border:none;"></iframe>',
        height=1000,
        scrolling=True,
    )

with tabs[1]:
    st.subheader("Admin Page")
    st.components.v1.html(
        '<iframe src="http://localhost:8000/admin.html" style="width:100%; height:1000px; border:none;"></iframe>',
        height=1000,
        scrolling=True,
    )