// // app/(main)/admin/users/page.tsx
// 'use client';

// import { useEffect, useState } from 'react';
// import { ref, onValue, remove, update, set } from 'firebase/database';
// import { database } from '../../../lib/firebase/config';
// import { UserData } from '../../../lib/utils/types';
// import { getAuth,  createUserWithEmailAndPassword } from 'firebase/auth';

// export default function UserManagement() {
//   const [users, setUsers] = useState<UserData[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [showModal, setShowModal] = useState(false);
//   const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
//   const [currentUser, setCurrentUser] = useState<UserData & {password?: string}>({
//     email: '',
//     firstName: '',
//     lastName: '',
//     isAdmin: false,
//     createdAt: '',
//   });
//   const [filterText, setFilterText] = useState('');
//   const [error , setError] = useState('');

//   useEffect(() => {
//     const usersRef = ref(database, 'users');
    
//     const unsubscribe = onValue(usersRef, (snapshot) => {
//       if (snapshot.exists()) {
//         const data = snapshot.val();
//         const usersArray = Object.keys(data).map(key => ({
//           uid: key,
//           ...data[key]
//         }));
        
//         setUsers(usersArray);
//       } else {
//         setUsers([]);
//       }
//       setLoading(false);
//     });

//     return () => unsubscribe();
//   }, []);

//   const handleAddUser = () => {
//     setModalMode('add');
//     setCurrentUser({
//       email: '',
//       firstName: '',
//       lastName: '',
//       isAdmin: false,
//       createdAt: new Date().toISOString(),
//       password: '',
//     });
//     setError('');
//     setShowModal(true);
//   };

//   const handleEditUser = (user: UserData) => {
//     setModalMode('edit');
//     setCurrentUser({...user, password: ''});
//     setError('');
//     setShowModal(true);
//   };

//   const handleDeleteUser = async (uid: string) => {
//     if (window.confirm('Are you sure you want to delete this user?')) {
//       try {
//         const userRef = ref(database, `users/${uid}`);
//         await remove(userRef);

//         setUsers(prevUsers => prevUsers.filter(user => user.uid !== uid));

//         alert ('User deleted from database.');
//       } catch (error) {
//         console.error('Error deleting user:', error);
//         alert('Failed to delete user.');
//       }
//     }
//   };

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value, type, checked } = e.target;
//     setCurrentUser(prev => ({
//       ...prev,
//       [name]: type === 'checkbox' ? checked : value
//     }));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError('');
    
//     try {
//       const auth = getAuth();

//       if (modalMode === 'add') {

//         if (!currentUser.password || currentUser.password.length < 6) {
//           setError('Password must be at least 6 characters long.');
//           return;
//         }

//         //create authentication account
//         const userCredential = await createUserWithEmailAndPassword(
//           auth, 
//           currentUser.email, 
//           currentUser.password
//         );
//         //store user data in database
//         // use the UID from auth as the key
//         const userRef = ref(database, `users/${userCredential.user.uid}`);
//         // remove password before storing in db
//         const { ...userDataWithoutPassword } = currentUser;

//         await set(userRef, 
//           {...userDataWithoutPassword,
//             createdAt: new Date().toISOString(),
//           });

//           alert('user created successfully!');
//         } else {
//           // Update existing user
//           const userRef = ref(database, `users/${currentUser.uid}`);
//           const userDataWithoutPassword = { ...currentUser };
//           delete userDataWithoutPassword.password;

//           await update(userRef, userDataWithoutPassword);

//           setUsers(prevUsers => 
//             prevUsers.map(user =>
//               user.uid === currentUser.uid ? { ...user, ...userDataWithoutPassword } : user
//             )
//           );

//           alert('user updated successfully!');
//         }
      
//       setShowModal(false);
//     } catch (error) {
//       console.error('Error saving user:', error);
//       alert('Failed to save user.');
//     }
//   };

//   const filteredUsers = users.filter(user => {
//     const searchText = filterText.toLowerCase();
//     return (
//       user.email.toLowerCase().includes(searchText) ||
//       user.firstName.toLowerCase().includes(searchText) ||
//       user.lastName.toLowerCase().includes(searchText)
//     );
//   });

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
//       </div>
//     );
//   }

//   return (
//     <div>
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-3xl font-bold">User Management</h1>
//         <button
//           onClick={handleAddUser}
//           className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
//         >
//           Add New User
//         </button>
//       </div>
      
//       <div className="mb-6">
//         <input
//           type="text"
//           placeholder="Search users..."
//           value={filterText}
//           onChange={(e) => setFilterText(e.target.value)}
//           className="w-full p-2 border border-gray-300 rounded-lg"
//         />
//       </div>
      
//       <div className="bg-white shadow-md rounded-lg overflow-hidden">
//         <table className="min-w-full divide-y divide-gray-200">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Name
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Email
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Role
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Created At
//               </th>
//               <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Actions
//               </th>
//             </tr>
//           </thead>
//           <tbody className="bg-white divide-y divide-gray-200">
//             {filteredUsers.length === 0 ? (
//               <tr>
//                 <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
//                   No users found.
//                 </td>
//               </tr>
//             ) : (
//               filteredUsers.map((user) => (
//                 <tr key={user.uid} className="hover:bg-gray-50">
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div className="flex items-center">
//                       <div className="ml-4">
//                         <div className="text-sm font-medium text-gray-900">
//                           {user.firstName} {user.lastName}
//                         </div>
//                       </div>
//                     </div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div className="text-sm text-gray-900">{user.email}</div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
//                       user.isAdmin ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
//                     }`}>
//                       {user.isAdmin ? 'Admin' : 'User'}
//                     </span>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                     {new Date(user.createdAt).toLocaleDateString()}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
//                     <button
//                       onClick={() => handleEditUser(user)}
//                       className="text-blue-600 hover:text-blue-900 mr-4"
//                     >
//                       Edit
//                     </button>
//                     <button
//                       onClick={() => handleDeleteUser(user.uid!)}
//                       className="text-red-600 hover:text-red-900"
//                     >
//                       Delete
//                     </button>
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>
      
//       {/* Add/Edit User Modal */}
//       {showModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
//             <h2 className="text-2xl font-bold mb-4">
//               {modalMode === 'add' ? 'Add New User' : 'Edit User'}
//             </h2>
            
//             <form onSubmit={handleSubmit}>
//               {error && (
//                 <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
//                   {error}
//                 </div>
//               )}
//               <div className="mb-4">
//                 <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
//                   Email
//                 </label>
//                 <input
//                   type="email"
//                   id="email"
//                   name="email"
//                   value={currentUser.email}
//                   onChange={handleInputChange}
//                   required
//                   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>

//               <div className="mb-4">
//                 <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
//                   {modalMode === 'add' ? 'Password' : 'New Password (leave blank to keep current)'}
//                 </label>
//                 <input
//                   type="password"
//                   id="password"
//                   name="password"
//                   value={currentUser.password || ''}
//                   onChange={handleInputChange}
//                   required={modalMode === 'add'}
//                   minLength={6}
//                   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 />
//                 <p className="text-xs text-gray-500 mt-1">
//                   {modalMode === 'add' 
//                     ? 'Password must be at least 6 characters long.' 
//                     : 'Leave blank to keep the current password.'}
//                 </p>
//               </div>

//               <div className="mb-4">
//                 <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="firstName">
//                   First Name
//                 </label>
//                 <input
//                   type="text"
//                   id="firstName"
//                   name="firstName"
//                   value={currentUser.firstName}
//                   onChange={handleInputChange}
//                   required
//                   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>
              
//               <div className="mb-4">
//                 <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lastName">
//                   Last Name
//                 </label>
//                 <input
//                   type="text"
//                   id="lastName"
//                   name="lastName"
//                   value={currentUser.lastName}
//                   onChange={handleInputChange}
//                   required
//                   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>
              
//               <div className="mb-6">
//                 <label className="flex items-center">
//                   <input
//                     type="checkbox"
//                     name="isAdmin"
//                     checked={currentUser.isAdmin}
//                     onChange={handleInputChange}
//                     className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
//                   />
//                   <span className="ml-2 text-gray-700">Admin privileges</span>
//                 </label>
//               </div>
              
//               <div className="flex justify-end">
//                 <button
//                   type="button"
//                   onClick={() => setShowModal(false)}
//                   className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
//                 >
//                   Save
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// app/(main)/admin/users/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { ref, onValue, remove, update, set } from 'firebase/database';
import { database } from '../../../lib/firebase/config';
import { UserData } from '../../../lib/utils/types';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

export default function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentUser, setCurrentUser] = useState<UserData & {password?: string}>({
    email: '',
    firstName: '',
    lastName: '',
    isAdmin: false,
    createdAt: '',
  });
  const [filterText, setFilterText] = useState('');
  const [error, setError] = useState('');

  // Get current logged-in user email for re-authentication
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  // Store admin email when component mounts
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && user.email) {
        setAdminEmail(user.email);
      }
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const usersRef = ref(database, 'users');
    
    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const usersArray = Object.keys(data).map(key => ({
          uid: key,
          ...data[key]
        }));
        
        setUsers(usersArray);
      } else {
        setUsers([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddUser = () => {
    setModalMode('add');
    setCurrentUser({
      email: '',
      firstName: '',
      lastName: '',
      isAdmin: false,
      createdAt: new Date().toISOString(),
      password: '',
    });
    setError('');
    setShowModal(true);
  };

  const handleEditUser = (user: UserData) => {
    setModalMode('edit');
    setCurrentUser({...user, password: ''});
    setError('');
    setShowModal(true);
  };

  const handleDeleteUser = async (uid: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const userRef = ref(database, `users/${uid}`);
        await remove(userRef);

        setUsers(prevUsers => prevUsers.filter(user => user.uid !== uid));

        alert('User deleted from database.');
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user.');
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setCurrentUser(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const auth = getAuth();

      if (modalMode === 'add') {
        if (!currentUser.password || currentUser.password.length < 6) {
          setError('Password must be at least 6 characters long.');
          return;
        }

        // Store current admin user
        const adminUser = auth.currentUser;
        if (!adminUser) {
          setError('Admin authentication required.');
          return;
        }

        // Ask for admin password to use for re-authentication
        const adminPassword = window.prompt('Enter your admin password to continue:');
        if (!adminPassword) {
          setError('Admin password required to create new users.');
          return;
        }

        // Create the new user account first
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          currentUser.email, 
          currentUser.password || ''
        );
        
        // Store user data in database
        const userRef = ref(database, `users/${userCredential.user.uid}`);
        const { ...userDataWithoutPassword } = currentUser;

        await set(userRef, {
          ...userDataWithoutPassword,
          createdAt: new Date().toISOString(),
        });

        // Sign back in as admin
        if (adminEmail) {
          try {
            await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
            alert('User created successfully!');
          } catch (signInError) {
            console.error('Error signing back in as admin:', signInError);
            alert('User created but admin session expired. Please sign in again.');
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          }
        }
      } else {
        // Update existing user
        if (!currentUser.uid) {
          setError('User ID is missing');
          return;
        }
        
        const userRef = ref(database, `users/${currentUser.uid}`);
        const { ...userDataWithoutPassword } = currentUser;

        await update(userRef, userDataWithoutPassword);

        setUsers(prevUsers => 
          prevUsers.map(user =>
            user.uid === currentUser.uid ? { ...user, ...userDataWithoutPassword } : user
          )
        );

        alert('User updated successfully!');
      }
      
      setShowModal(false);
    } catch (error) {
      console.error('Error saving user:', error);
      // TypeScript-safe error handling
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to save user: ${errorMessage}`);
    }
  };

  const filteredUsers = users.filter(user => {
    const searchText = filterText.toLowerCase();
    return (
      user.email.toLowerCase().includes(searchText) ||
      user.firstName.toLowerCase().includes(searchText) ||
      user.lastName.toLowerCase().includes(searchText)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <button
          onClick={handleAddUser}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
        >
          Add New User
        </button>
      </div>
      
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search users..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg"
        />
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.uid} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.isAdmin ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.isAdmin ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.uid as string)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">
              {modalMode === 'add' ? 'Add New User' : 'Edit User'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                  {error}
                </div>
              )}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={currentUser.email}
                  onChange={handleInputChange}
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                  {modalMode === 'add' ? 'Password' : 'New Password (leave blank to keep current)'}
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={currentUser.password || ''}
                  onChange={handleInputChange}
                  required={modalMode === 'add'}
                  minLength={6}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {modalMode === 'add' 
                    ? 'Password must be at least 6 characters long.' 
                    : 'Leave blank to keep the current password.'}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="firstName">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={currentUser.firstName}
                  onChange={handleInputChange}
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lastName">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={currentUser.lastName}
                  onChange={handleInputChange}
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isAdmin"
                    checked={currentUser.isAdmin}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-gray-700">Admin privileges</span>
                </label>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}